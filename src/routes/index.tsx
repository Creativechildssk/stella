import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PhotoMasonry } from "@/components/photo-card";
import { FollowButton, StarButton } from "@/components/star-actions";
import { essays, type Mission, type Photo, type Photographer } from "@/lib/catalog";
import { useMe } from "@/lib/me";
import { listMissions, listPhotographers, listPhotos } from "@/lib/stella-api";
import { daysLeft, formatCount } from "@/lib/utils";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const { me } = useMe();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photographers, setPhotographers] = useState<Photographer[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [tab, setTab] = useState<"inspiration" | "latest" | "following">(
    "inspiration",
  );

  useEffect(() => {
    void Promise.all([listPhotos(), listPhotographers(), listMissions()]).then(
      ([p, people, m]) => {
        setPhotos(p);
        setPhotographers(people);
        setMissions(m);
      },
    );
  }, []);

  const potd = photos.find((p) => p.photoOfTheDay) ?? photos[0];
  const author = potd
    ? photographers.find((p) => p.slug === potd.photographerSlug)
    : undefined;
  const followed = me?.followedSlugs ?? [];
  const starredIds = me?.starredIds ?? [];

  const feed = useMemo(() => {
    const pool = photos;
    if (tab === "latest") {
      return [...pool].sort(
        (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
      );
    }
    if (tab === "following") {
      return pool.filter((p) => followed.includes(p.photographerSlug));
    }
    const featured = pool.filter((p) => p.featured);
    const lifted = pool.filter((p) => starredIds.includes(p.id) && !p.featured);
    const rest = pool.filter((p) => !p.featured && !starredIds.includes(p.id));
    return [...lifted, ...featured, ...rest].slice(0, 28);
  }, [tab, photos, followed, starredIds]);

  if (!potd) {
    return (
      <div className="px-4 py-24 text-center text-sm text-muted-foreground">
        Loading the feed…
      </div>
    );
  }

  const heroSrc = potd.src.includes("images.unsplash.com")
    ? `${potd.src.split("?")[0]}?auto=format&fit=crop&w=2000&q=80`
    : potd.src;

  return (
    <div>
      <section className="relative min-h-[78dvh] w-full overflow-hidden bg-muted">
        <img
          src={heroSrc}
          alt={potd.title}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/45 to-background/10" />
        <div className="relative mx-auto flex min-h-[78dvh] max-w-[1400px] flex-col justify-end px-4 pb-10 pt-24 md:px-6 md:pb-16">
          <p className="text-[11px] uppercase tracking-[0.22em] text-foreground/80">
            Photograph of the day
          </p>
          <h1 className="mt-3 max-w-3xl font-serif text-4xl italic leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
            {potd.title}
          </h1>
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            {author && (
              <Link
                to="/photographer/$slug"
                params={{ slug: author.slug }}
                className="inline-flex items-center gap-2"
              >
                {author.avatar ? (
                  <img
                    src={author.avatar}
                    alt=""
                    className="size-8 rounded-full object-cover"
                  />
                ) : null}
                <span>
                  {author.name}
                  <span className="text-muted-foreground">
                    {" "}
                    · {author.city}
                  </span>
                </span>
              </Link>
            )}
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Star className="size-3.5 fill-foreground text-foreground" />
              {formatCount(potd.stars)}
            </span>
          </div>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-foreground/80 md:text-base">
            {potd.description}
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              to="/photo/$photoId"
              params={{ photoId: potd.id }}
              className="inline-flex h-11 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
            >
              Open photograph
            </Link>
            <StarButton photoId={potd.id} />
            {author && <FollowButton slug={author.slug} />}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-4 py-12 md:px-6 md:py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              The feed
            </p>
            <h2 className="mt-1 font-serif text-3xl italic md:text-4xl">
              Inspiration
            </h2>
          </div>
          <div className="flex gap-1 rounded-md border border-border p-1">
            {(
              [
                ["inspiration", "Inspiration"],
                ["latest", "Latest"],
                ["following", "Following"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={
                  tab === id
                    ? "h-9 rounded-sm bg-primary px-3 text-sm text-primary-foreground"
                    : "h-9 rounded-sm px-3 text-sm text-muted-foreground hover:text-foreground"
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Five stars a day. Spend them on work that should rise. Sign in so
          your stars travel with you.
        </p>
        <div className="mt-8">
          <PhotoMasonry photos={feed} />
        </div>
      </section>

      <section className="border-y border-border bg-card/40">
        <div className="mx-auto max-w-[1400px] px-4 py-12 md:px-6 md:py-16">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                This month
              </p>
              <h2 className="mt-1 font-serif text-3xl italic">Missions</h2>
            </div>
            <Link
              to="/missions"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              All missions <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="mt-8 grid gap-3 md:grid-cols-3">
            {missions.slice(0, 3).map((m) => (
              <Link
                key={m.id}
                to="/mission/$missionId"
                params={{ missionId: m.id }}
                className="group relative min-h-56 overflow-hidden bg-muted"
              >
                <img
                  src={m.cover}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                <div className="relative flex h-full min-h-56 flex-col justify-end p-5">
                  <p className="text-[11px] uppercase tracking-wider text-foreground/70">
                    {daysLeft(m.endsAt)} days left · {m.category}
                  </p>
                  <h3 className="mt-1 font-serif text-2xl italic">{m.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-foreground/75">
                    {m.brief}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-4 py-12 md:px-6 md:py-16">
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          Photographers
        </p>
        <h2 className="mt-1 font-serif text-3xl italic">People to follow</h2>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {photographers.slice(0, 8).map((p) => (
            <article key={p.slug} className="border border-border bg-card p-4">
              <Link
                to="/photographer/$slug"
                params={{ slug: p.slug }}
                className="flex items-center gap-3"
              >
                {p.avatar ? (
                  <img
                    src={p.avatar}
                    alt=""
                    className="size-12 rounded-full object-cover"
                  />
                ) : (
                  <span className="grid size-12 place-items-center rounded-full bg-muted font-serif italic">
                    {p.name.charAt(0)}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate font-medium">{p.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {p.city} · Level {p.level}
                  </p>
                </div>
              </Link>
              <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">
                {p.bio}
              </p>
              <div className="mt-4">
                <FollowButton slug={p.slug} />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto grid max-w-[1400px] gap-8 px-4 py-12 md:grid-cols-3 md:px-6 md:py-16">
          {essays.map((e) => (
            <article key={e.id}>
              <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                Notes
              </p>
              <h3 className="mt-2 font-serif text-2xl italic leading-snug">
                {e.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {e.dek}
              </p>
            </article>
          ))}
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-3 px-4 py-10 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between md:px-6">
          <p className="font-serif italic text-foreground">Stella</p>
          <p>A community for photographers. Inspiration, stars, and craft.</p>
        </div>
      </footer>
    </div>
  );
}
