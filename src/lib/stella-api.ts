import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import {
  missions as seedMissions,
  photographers as seedPhotographers,
  photos as seedPhotos,
  type Category,
  type Comment,
  type Mission,
  type Photo,
  type Photographer,
} from "@/lib/catalog";

export const DAILY_STARS = 5;

export type Me = {
  userId: string;
  displayName: string;
  email: string;
  slug: string;
  role: "member" | "superadmin";
  isSuperadmin: boolean;
  starsLeft: number;
  starredIds: string[];
  savedIds: string[];
  followedSlugs: string[];
};

export type AdminStats = {
  photos: number;
  photographers: number;
  missions: number;
  members: number;
  stars: number;
};

type PhotoRow = {
  id: string;
  title: string;
  photographer_slug: string;
  photographer_name?: string;
  owner_user_id: string | null;
  category: string;
  src: string;
  width: number;
  height: number;
  stars: number;
  views: number;
  location: string;
  description: string;
  created_at: string;
  featured: boolean;
  photo_of_the_day: boolean;
  camera: string;
  lens: string;
  focal: string;
  aperture: string;
  shutter: string;
  iso: string;
};

type PhotographerRow = {
  slug: string;
  name: string;
  city: string;
  country: string;
  bio: string;
  avatar: string;
  cover: string;
  level: number;
  followers: number;
  following: number;
  gear: string;
  joined: string;
  owner_user_id: string | null;
};

type MissionRow = {
  id: string;
  title: string;
  brief: string;
  cover: string;
  category: string;
  ends_at: string;
  prize: string;
  curator: string;
};

let seedLock: Promise<void> | null = null;

function parseGear(raw: string): string[] {
  try {
    const v = JSON.parse(raw) as unknown;
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

function mapPhotographer(row: PhotographerRow): Photographer {
  return {
    slug: row.slug,
    name: row.name,
    city: row.city,
    country: row.country,
    bio: row.bio,
    avatar: row.avatar,
    cover: row.cover,
    level: row.level,
    followers: row.followers,
    following: row.following,
    gear: parseGear(row.gear),
    joined: row.joined,
  };
}

function mapPhoto(row: PhotoRow, comments: Comment[] = []): Photo {
  return {
    id: row.id,
    title: row.title,
    photographerSlug: row.photographer_slug,
    photographerName: row.photographer_name,
    category: row.category as Category,
    src: row.src,
    width: row.width,
    height: row.height,
    stars: row.stars,
    views: row.views,
    location: row.location,
    description: row.description,
    createdAt:
      typeof row.created_at === "string"
        ? row.created_at
        : new Date(row.created_at).toISOString(),
    featured: Boolean(row.featured),
    photoOfTheDay: Boolean(row.photo_of_the_day),
    camera: row.camera,
    lens: row.lens,
    focal: row.focal,
    aperture: row.aperture,
    shutter: row.shutter,
    iso: row.iso,
    comments,
  };
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

async function ensureSeed() {
  if (!seedLock) {
    seedLock = (async () => {
      const sql = await getSql();
      const count = await sql<{ c: number }>`select count(*)::int as c from photographers`;
      if ((count[0]?.c ?? 0) > 0) return;
      for (const p of seedPhotographers) {
        await sql`
          insert into photographers (
            slug, name, city, country, bio, avatar, cover, level, followers, following, gear, joined
          ) values (
            ${p.slug}, ${p.name}, ${p.city}, ${p.country}, ${p.bio}, ${p.avatar}, ${p.cover},
            ${p.level}, ${p.followers}, ${p.following}, ${JSON.stringify(p.gear)}, ${p.joined}
          )
        `;
      }
      for (const p of seedPhotos) {
        await sql`
          insert into photos (
            id, title, photographer_slug, category, src, width, height, stars, views,
            location, description, created_at, featured, photo_of_the_day,
            camera, lens, focal, aperture, shutter, iso
          ) values (
            ${p.id}, ${p.title}, ${p.photographerSlug}, ${p.category}, ${p.src},
            ${p.width}, ${p.height}, ${p.stars}, ${p.views}, ${p.location}, ${p.description},
            ${p.createdAt}::timestamptz, ${Boolean(p.featured)}, ${Boolean(p.photoOfTheDay)},
            ${p.camera}, ${p.lens}, ${p.focal}, ${p.aperture}, ${p.shutter}, ${p.iso}
          )
        `;
        for (const c of p.comments) {
          await sql`
            insert into comments (id, photo_id, user_id, author, avatar, body, created_at)
            values (
              ${c.id}, ${p.id}, ${"catalog"}, ${c.author}, ${c.avatar}, ${c.text},
              ${c.createdAt}::timestamptz
            )
          `;
        }
      }
      for (const m of seedMissions) {
        await sql`
          insert into missions (id, title, brief, cover, category, ends_at, prize, curator)
          values (
            ${m.id}, ${m.title}, ${m.brief}, ${m.cover}, ${m.category},
            ${m.endsAt}::timestamptz, ${m.prize}, ${m.curator}
          )
        `;
        for (const photoId of m.entries) {
          await sql`
            insert into mission_entries (mission_id, photo_id)
            values (${m.id}, ${photoId})
            on conflict do nothing
          `;
        }
      }
    })().catch((err) => {
      seedLock = null;
      throw err;
    });
  }
  await seedLock;
}

async function commentsFor(photoId: string): Promise<Comment[]> {
  const sql = await getSql();
  const rows = await sql<{
    id: string;
    author: string;
    avatar: string;
    body: string;
    created_at: string;
  }>`
    select id, author, avatar, body, created_at
    from comments
    where photo_id = ${photoId}
    order by created_at asc
  `;
  return rows.map((r) => ({
    id: r.id,
    author: r.author,
    avatar: r.avatar,
    text: r.body,
    createdAt:
      typeof r.created_at === "string"
        ? r.created_at
        : new Date(r.created_at).toISOString(),
  }));
}

async function requireAdmin(userId: string) {
  const sql = await getSql();
  const rows = await sql<{ role: string }>`
    select role from profiles where user_id = ${userId}
  `;
  if (rows[0]?.role !== "superadmin") {
    throw new Error("Forbidden");
  }
}

export const listPhotos = createServerFn({ method: "GET" }).handler(async () => {
  await ensureSeed();
  const sql = await getSql();
  const rows = await sql<PhotoRow>`
    select p.*, ph.name as photographer_name
    from photos p
    join photographers ph on ph.slug = p.photographer_slug
    order by p.created_at desc
  `;
  return rows.map((r) => mapPhoto(r));
});

export const getPhotoById = createServerFn({ method: "GET" })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    await ensureSeed();
    const sql = await getSql();
    await sql`update photos set views = views + 1 where id = ${id}`;
    const rows = await sql<PhotoRow>`
      select p.*, ph.name as photographer_name
      from photos p
      join photographers ph on ph.slug = p.photographer_slug
      where p.id = ${id}
    `;
    const row = rows[0];
    if (!row) return null;
    return mapPhoto(row, await commentsFor(id));
  });

export const listPhotographers = createServerFn({ method: "GET" }).handler(
  async () => {
    await ensureSeed();
    const sql = await getSql();
    const rows = await sql<PhotographerRow>`
      select * from photographers order by followers desc
    `;
    return rows.map(mapPhotographer);
  },
);

export const getPhotographerBySlug = createServerFn({ method: "GET" })
  .validator((slug: string) => slug)
  .handler(async ({ data: slug }) => {
    await ensureSeed();
    const sql = await getSql();
    const rows = await sql<PhotographerRow>`
      select * from photographers where slug = ${slug}
    `;
    const row = rows[0];
    if (!row) return null;
    const work = await sql<PhotoRow>`
      select p.*, ph.name as photographer_name
      from photos p
      join photographers ph on ph.slug = p.photographer_slug
      where p.photographer_slug = ${slug}
      order by p.created_at desc
    `;
    return { photographer: mapPhotographer(row), photos: work.map((p) => mapPhoto(p)) };
  });

export const listMissions = createServerFn({ method: "GET" }).handler(async () => {
  await ensureSeed();
  const sql = await getSql();
  const rows = await sql<MissionRow>`select * from missions order by ends_at asc`;
  const entries = await sql<{ mission_id: string; photo_id: string }>`
    select mission_id, photo_id from mission_entries
  `;
  const byMission = new Map<string, string[]>();
  for (const e of entries) {
    const list = byMission.get(e.mission_id) ?? [];
    list.push(e.photo_id);
    byMission.set(e.mission_id, list);
  }
  return rows.map(
    (m): Mission => ({
      id: m.id,
      title: m.title,
      brief: m.brief,
      cover: m.cover,
      category: m.category as Category,
      endsAt:
        typeof m.ends_at === "string" ? m.ends_at : new Date(m.ends_at).toISOString(),
      prize: m.prize,
      curator: m.curator,
      entries: byMission.get(m.id) ?? [],
    }),
  );
});

export const getMissionById = createServerFn({ method: "GET" })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    await ensureSeed();
    const sql = await getSql();
    const rows = await sql<MissionRow>`select * from missions where id = ${id}`;
    const m = rows[0];
    if (!m) return null;
    const entryRows = await sql<{ photo_id: string }>`
      select photo_id from mission_entries where mission_id = ${id}
    `;
    const work = await sql<PhotoRow>`
      select p.*, ph.name as photographer_name
      from photos p
      join photographers ph on ph.slug = p.photographer_slug
      join mission_entries e on e.photo_id = p.id
      where e.mission_id = ${id}
    `;
    const mission: Mission = {
      id: m.id,
      title: m.title,
      brief: m.brief,
      cover: m.cover,
      category: m.category as Category,
      endsAt:
        typeof m.ends_at === "string" ? m.ends_at : new Date(m.ends_at).toISOString(),
      prize: m.prize,
      curator: m.curator,
      entries: entryRows.map((e) => e.photo_id),
    };
    return { mission, photos: work.map((p) => mapPhoto(p)) };
  });

export const searchStella = createServerFn({ method: "GET" })
  .validator((q: string) => q)
  .handler(async ({ data: q }) => {
    await ensureSeed();
    const needle = q.trim().toLowerCase();
    if (!needle) return { photos: [] as Photo[], photographers: [] as Photographer[] };
    const sql = await getSql();
    const like = `%${needle}%`;
    const photoRows = await sql<PhotoRow>`
      select p.*, ph.name as photographer_name from photos p
      join photographers ph on ph.slug = p.photographer_slug
      where lower(p.title) like ${like}
         or lower(p.location) like ${like}
         or lower(p.category) like ${like}
         or lower(ph.name) like ${like}
         or lower(p.camera) like ${like}
      limit 12
    `;
    const people = await sql<PhotographerRow>`
      select * from photographers
      where lower(name) like ${like}
         or lower(city) like ${like}
         or lower(country) like ${like}
      limit 6
    `;
    return {
      photos: photoRows.map((p) => mapPhoto(p)),
      photographers: people.map(mapPhotographer),
    };
  });

export const getMe = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await ensureSeed();
    const sql = await getSql();
    const userId = context.userId;
    const authUser = await sql<{ name: string; email: string }>`
      select name, email from "user" where id = ${userId}
    `;
    const displayName = authUser[0]?.name || "Member";
    const email = authUser[0]?.email || "";
    const slug = `member-${userId.slice(0, 12)}`;

    await sql`
      insert into profiles (user_id, display_name, email, slug, role)
      values (${userId}, ${displayName}, ${email}, ${slug}, ${"member"})
      on conflict (user_id) do update set
        display_name = excluded.display_name,
        email = excluded.email
    `;

    const existingAdmin = await sql<{ user_id: string }>`
      select user_id from profiles where role = ${"superadmin"} limit 1
    `;
    if (existingAdmin.length === 0) {
      await sql`
        update profiles set role = ${"superadmin"}
        where user_id = ${userId}
          and not exists (select 1 from profiles where role = ${"superadmin"})
      `;
    }

    await sql`
      insert into photographers (
        slug, name, city, country, bio, avatar, cover, level, followers, following, gear, joined, owner_user_id
      )
      values (
        ${slug}, ${displayName}, ${""}, ${""}, ${"Member of Stella."}, ${""}, ${""},
        ${1}, ${0}, ${0}, ${"[]"}, ${new Date().toISOString().slice(0, 10)}, ${userId}
      )
      on conflict (slug) do update set name = excluded.name, owner_user_id = excluded.owner_user_id
    `;

    const profile = await sql<{ role: string; display_name: string; email: string; slug: string }>`
      select role, display_name, email, slug from profiles where user_id = ${userId}
    `;
    const day = todayKey();
    await sql`
      insert into star_days (user_id, day, remaining)
      values (${userId}, ${day}, ${DAILY_STARS})
      on conflict (user_id, day) do nothing
    `;
    const quota = await sql<{ remaining: number }>`
      select remaining from star_days where user_id = ${userId} and day = ${day}
    `;
    const starred = await sql<{ photo_id: string }>`
      select photo_id from stars where user_id = ${userId}
    `;
    const saved = await sql<{ photo_id: string }>`
      select photo_id from saves where user_id = ${userId}
    `;
    const followed = await sql<{ photographer_slug: string }>`
      select photographer_slug from follows where user_id = ${userId}
    `;
    const role = (profile[0]?.role === "superadmin" ? "superadmin" : "member") as
      | "member"
      | "superadmin";
    const me: Me = {
      userId,
      displayName: profile[0]?.display_name || displayName,
      email: profile[0]?.email || email,
      slug: profile[0]?.slug || slug,
      role,
      isSuperadmin: role === "superadmin",
      starsLeft: quota[0]?.remaining ?? DAILY_STARS,
      starredIds: starred.map((r) => r.photo_id),
      savedIds: saved.map((r) => r.photo_id),
      followedSlugs: followed.map((r) => r.photographer_slug),
    };
    return me;
  });

export const starPhoto = createServerFn({ method: "POST" })
  .validator((photoId: string) => photoId)
  .middleware([authMiddleware])
  .handler(async ({ context, data: photoId }) => {
    const sql = await getSql();
    const day = todayKey();
    await sql`
      insert into star_days (user_id, day, remaining)
      values (${context.userId}, ${day}, ${DAILY_STARS})
      on conflict (user_id, day) do nothing
    `;
    const already = await sql<{ photo_id: string }>`
      select photo_id from stars where user_id = ${context.userId} and photo_id = ${photoId}
    `;
    if (already.length) return { ok: false as const, reason: "already" as const, remaining: 0 };
    const quota = await sql<{ remaining: number }>`
      select remaining from star_days where user_id = ${context.userId} and day = ${day}
    `;
    const remaining = quota[0]?.remaining ?? 0;
    if (remaining <= 0) return { ok: false as const, reason: "empty" as const, remaining: 0 };
    await sql`
      insert into stars (user_id, photo_id) values (${context.userId}, ${photoId})
    `;
    await sql`
      update star_days set remaining = remaining - 1
      where user_id = ${context.userId} and day = ${day}
    `;
    await sql`update photos set stars = stars + 1 where id = ${photoId}`;
    return { ok: true as const, reason: "ok" as const, remaining: remaining - 1 };
  });

export const toggleSave = createServerFn({ method: "POST" })
  .validator((photoId: string) => photoId)
  .middleware([authMiddleware])
  .handler(async ({ context, data: photoId }) => {
    const sql = await getSql();
    const existing = await sql<{ photo_id: string }>`
      select photo_id from saves where user_id = ${context.userId} and photo_id = ${photoId}
    `;
    if (existing.length) {
      await sql`
        delete from saves where user_id = ${context.userId} and photo_id = ${photoId}
      `;
      return { saved: false };
    }
    await sql`
      insert into saves (user_id, photo_id) values (${context.userId}, ${photoId})
    `;
    return { saved: true };
  });

export const toggleFollow = createServerFn({ method: "POST" })
  .validator((slug: string) => slug)
  .middleware([authMiddleware])
  .handler(async ({ context, data: slug }) => {
    const sql = await getSql();
    const existing = await sql<{ photographer_slug: string }>`
      select photographer_slug from follows
      where user_id = ${context.userId} and photographer_slug = ${slug}
    `;
    if (existing.length) {
      await sql`
        delete from follows where user_id = ${context.userId} and photographer_slug = ${slug}
      `;
      await sql`update photographers set followers = greatest(followers - 1, 0) where slug = ${slug}`;
      return { followed: false };
    }
    await sql`
      insert into follows (user_id, photographer_slug) values (${context.userId}, ${slug})
    `;
    await sql`update photographers set followers = followers + 1 where slug = ${slug}`;
    return { followed: true };
  });

export const addComment = createServerFn({ method: "POST" })
  .validator((input: { photoId: string; text: string }) => input)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const text = data.text.trim();
    if (!text) return null;
    const sql = await getSql();
    const profile = await sql<{ display_name: string }>`
      select display_name from profiles where user_id = ${context.userId}
    `;
    const id = `c-${Date.now()}`;
    const createdAt = new Date().toISOString();
    const author = profile[0]?.display_name || "Member";
    await sql`
      insert into comments (id, photo_id, user_id, author, avatar, body, created_at)
      values (${id}, ${data.photoId}, ${context.userId}, ${author}, ${""}, ${text}, ${createdAt}::timestamptz)
    `;
    const comment: Comment = { id, author, avatar: "", text, createdAt };
    return comment;
  });

export const publishPhoto = createServerFn({ method: "POST" })
  .validator(
    (input: {
      title: string;
      category: Category;
      location: string;
      description: string;
      src: string;
      width: number;
      height: number;
      camera: string;
      lens: string;
      focal: string;
      aperture: string;
      shutter: string;
      iso: string;
    }) => input,
  )
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const profile = await sql<{ slug: string; display_name: string }>`
      select slug, display_name from profiles where user_id = ${context.userId}
    `;
    const slug = profile[0]?.slug;
    if (!slug) throw new Error("Profile missing");
    const id = `you-${Date.now()}`;
    await sql`
      insert into photos (
        id, title, photographer_slug, owner_user_id, category, src, width, height,
        location, description, camera, lens, focal, aperture, shutter, iso
      ) values (
        ${id}, ${data.title.trim() || "Untitled"}, ${slug}, ${context.userId},
        ${data.category}, ${data.src}, ${data.width}, ${data.height},
        ${data.location.trim() || "Somewhere"}, ${data.description.trim()},
        ${data.camera || "Unknown camera"}, ${data.lens || "—"}, ${data.focal || "—"},
        ${data.aperture || "—"}, ${data.shutter || "—"}, ${data.iso || "—"}
      )
    `;
    return { id };
  });

export const adminStats = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireAdmin(context.userId);
    const sql = await getSql();
    const photos = await sql<{ c: number }>`select count(*)::int as c from photos`;
    const photographers = await sql<{ c: number }>`select count(*)::int as c from photographers`;
    const missions = await sql<{ c: number }>`select count(*)::int as c from missions`;
    const members = await sql<{ c: number }>`select count(*)::int as c from profiles`;
    const stars = await sql<{ c: number }>`select count(*)::int as c from stars`;
    return {
      photos: photos[0]?.c ?? 0,
      photographers: photographers[0]?.c ?? 0,
      missions: missions[0]?.c ?? 0,
      members: members[0]?.c ?? 0,
      stars: stars[0]?.c ?? 0,
    } satisfies AdminStats;
  });

export const adminListUsers = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireAdmin(context.userId);
    const sql = await getSql();
    return sql<{
      user_id: string;
      display_name: string;
      email: string;
      slug: string;
      role: string;
      created_at: string;
    }>`
      select user_id, display_name, email, slug, role, created_at
      from profiles
      order by created_at desc
    `;
  });

export const adminSetFeatured = createServerFn({ method: "POST" })
  .validator((input: { id: string; featured: boolean }) => input)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    const sql = await getSql();
    await sql`update photos set featured = ${data.featured} where id = ${data.id}`;
    return { ok: true };
  });

export const adminSetPhotoOfTheDay = createServerFn({ method: "POST" })
  .validator((id: string) => id)
  .middleware([authMiddleware])
  .handler(async ({ context, data: id }) => {
    await requireAdmin(context.userId);
    const sql = await getSql();
    await sql`update photos set photo_of_the_day = false`;
    await sql`update photos set photo_of_the_day = true, featured = true where id = ${id}`;
    return { ok: true };
  });

export const adminDeletePhoto = createServerFn({ method: "POST" })
  .validator((id: string) => id)
  .middleware([authMiddleware])
  .handler(async ({ context, data: id }) => {
    await requireAdmin(context.userId);
    const sql = await getSql();
    await sql`delete from photos where id = ${id}`;
    return { ok: true };
  });

export const adminDeleteComment = createServerFn({ method: "POST" })
  .validator((id: string) => id)
  .middleware([authMiddleware])
  .handler(async ({ context, data: id }) => {
    await requireAdmin(context.userId);
    const sql = await getSql();
    await sql`delete from comments where id = ${id}`;
    return { ok: true };
  });

export const adminUpsertMission = createServerFn({ method: "POST" })
  .validator(
    (input: {
      id: string;
      title: string;
      brief: string;
      cover: string;
      category: string;
      endsAt: string;
      prize: string;
      curator: string;
    }) => input,
  )
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    const sql = await getSql();
    const id =
      data.id.trim() ||
      data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    await sql`
      insert into missions (id, title, brief, cover, category, ends_at, prize, curator)
      values (
        ${id}, ${data.title}, ${data.brief}, ${data.cover}, ${data.category},
        ${data.endsAt}::timestamptz, ${data.prize}, ${data.curator}
      )
      on conflict (id) do update set
        title = excluded.title,
        brief = excluded.brief,
        cover = excluded.cover,
        category = excluded.category,
        ends_at = excluded.ends_at,
        prize = excluded.prize,
        curator = excluded.curator
    `;
    return { id };
  });

export const adminDeleteMission = createServerFn({ method: "POST" })
  .validator((id: string) => id)
  .middleware([authMiddleware])
  .handler(async ({ context, data: id }) => {
    await requireAdmin(context.userId);
    const sql = await getSql();
    await sql`delete from missions where id = ${id}`;
    return { ok: true };
  });
