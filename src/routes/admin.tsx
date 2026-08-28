import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import type { Mission, Photo } from "@/lib/catalog";
import { useMe } from "@/lib/me";
import {
  adminDeleteMission,
  adminDeletePhoto,
  adminListUsers,
  adminSetFeatured,
  adminSetPhotoOfTheDay,
  adminStats,
  adminUpsertMission,
  listMissions,
  listPhotos,
  type AdminStats,
} from "@/lib/stella-api";
import { formatDate } from "@/lib/utils";

export const Route = createFileRoute("/admin")({ component: AdminPage });

function AdminPage() {
  const { user, isPending } = useCurrentUserState();
  const { me, loading } = useMe();
  const [tab, setTab] = useState<"overview" | "photos" | "missions" | "members">(
    "overview",
  );
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [users, setUsers] = useState<
    {
      user_id: string;
      display_name: string;
      email: string;
      slug: string;
      role: string;
      created_at: string;
    }[]
  >([]);

  async function reload() {
    const [s, p, m, u] = await Promise.all([
      adminStats(),
      listPhotos(),
      listMissions(),
      adminListUsers(),
    ]);
    setStats(s);
    setPhotos(p);
    setMissions(m);
    setUsers(u);
  }

  useEffect(() => {
    if (me?.isSuperadmin) void reload().catch(() => undefined);
  }, [me?.isSuperadmin]);

  if (isPending || (loading && !me)) {
    return (
      <div className="px-4 py-24 text-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }
  if (!user) return <RedirectToSignIn />;
  if (!me?.isSuperadmin) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <p className="font-serif text-3xl italic">Admin only</p>
        <p className="mt-3 text-sm text-muted-foreground">
          The first person to create an account becomes superadmin. Everyone
          else remains a member.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 md:px-6 md:py-12">
      <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
        Superadmin
      </p>
      <h1 className="mt-1 font-serif text-4xl italic">Control</h1>
      <p className="mt-3 max-w-xl text-sm text-muted-foreground">
        One seat. You can feature work, set the photograph of the day, edit
        missions, and see every member.
      </p>

      <div className="mt-8 flex gap-1 overflow-x-auto border-b border-border">
        {(
          [
            ["overview", "Overview"],
            ["photos", "Photographs"],
            ["missions", "Missions"],
            ["members", "Members"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={
              tab === id
                ? "h-11 border-b border-foreground px-4 text-sm"
                : "h-11 px-4 text-sm text-muted-foreground"
            }
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "overview" && stats && (
        <dl className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-5">
          {(
            [
              ["Photographs", stats.photos],
              ["Photographers", stats.photographers],
              ["Missions", stats.missions],
              ["Members", stats.members],
              ["Stars given", stats.stars],
            ] as const
          ).map(([k, v]) => (
            <div key={k} className="border border-border bg-card p-4">
              <dt className="text-xs text-muted-foreground">{k}</dt>
              <dd className="mt-1 font-serif text-3xl italic tabular-nums">{v}</dd>
            </div>
          ))}
        </dl>
      )}

      {tab === "photos" && (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="py-2 pr-3">Title</th>
                <th className="py-2 pr-3">Category</th>
                <th className="py-2 pr-3">Stars</th>
                <th className="py-2 pr-3">Flags</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {photos.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="py-3 pr-3">{p.title}</td>
                  <td className="py-3 pr-3 text-muted-foreground">{p.category}</td>
                  <td className="py-3 pr-3 tabular-nums">{p.stars}</td>
                  <td className="py-3 pr-3 text-xs text-muted-foreground">
                    {p.photoOfTheDay ? "Photo of the day · " : ""}
                    {p.featured ? "Featured" : ""}
                  </td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          await adminSetFeatured({
                            data: { id: p.id, featured: !p.featured },
                          });
                          await reload();
                        }}
                      >
                        {p.featured ? "Unfeature" : "Feature"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          await adminSetPhotoOfTheDay({ data: p.id });
                          await reload();
                        }}
                      >
                        Photo of the day
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          await adminDeletePhoto({ data: p.id });
                          await reload();
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "missions" && (
        <div className="mt-6 space-y-8">
          <MissionForm
            onSave={async (payload) => {
              await adminUpsertMission({ data: payload });
              await reload();
            }}
          />
          <ul className="space-y-3">
            {missions.map((m) => (
              <li
                key={m.id}
                className="flex flex-wrap items-center justify-between gap-3 border border-border bg-card p-4"
              >
                <div>
                  <p className="font-serif text-xl italic">{m.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {m.category} · ends {formatDate(m.endsAt)}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    await adminDeleteMission({ data: m.id });
                    await reload();
                  }}
                >
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === "members" && (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="py-2 pr-3">Name</th>
                <th className="py-2 pr-3">Email</th>
                <th className="py-2 pr-3">Role</th>
                <th className="py-2">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.user_id} className="border-t border-border">
                  <td className="py-3 pr-3">{u.display_name}</td>
                  <td className="py-3 pr-3 text-muted-foreground">{u.email}</td>
                  <td className="py-3 pr-3">{u.role}</td>
                  <td className="py-3 text-muted-foreground">
                    {formatDate(u.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function MissionForm({
  onSave,
}: {
  onSave: (payload: {
    id: string;
    title: string;
    brief: string;
    cover: string;
    category: string;
    endsAt: string;
    prize: string;
    curator: string;
  }) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [brief, setBrief] = useState("");
  const [cover, setCover] = useState("");
  const [category, setCategory] = useState("Landscape");
  const [endsAt, setEndsAt] = useState("2026-09-30T21:00");
  const [prize, setPrize] = useState("");
  const [curator, setCurator] = useState("");

  return (
    <form
      className="grid gap-3 border border-border bg-card p-4 md:grid-cols-2"
      onSubmit={async (e) => {
        e.preventDefault();
        await onSave({
          id: "",
          title,
          brief,
          cover,
          category,
          endsAt: new Date(endsAt).toISOString(),
          prize,
          curator,
        });
        setTitle("");
        setBrief("");
      }}
    >
      <p className="font-serif text-xl italic md:col-span-2">New mission</p>
      <input
        required
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        className="h-11 rounded-md border border-border bg-background px-3 text-sm"
      />
      <input
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        placeholder="Category"
        className="h-11 rounded-md border border-border bg-background px-3 text-sm"
      />
      <input
        value={cover}
        onChange={(e) => setCover(e.target.value)}
        placeholder="Cover image URL"
        className="h-11 rounded-md border border-border bg-background px-3 text-sm md:col-span-2"
      />
      <textarea
        required
        value={brief}
        onChange={(e) => setBrief(e.target.value)}
        placeholder="Brief"
        rows={3}
        className="rounded-md border border-border bg-background px-3 py-2 text-sm md:col-span-2"
      />
      <input
        type="datetime-local"
        value={endsAt}
        onChange={(e) => setEndsAt(e.target.value)}
        className="h-11 rounded-md border border-border bg-background px-3 text-sm"
      />
      <input
        value={prize}
        onChange={(e) => setPrize(e.target.value)}
        placeholder="Prize"
        className="h-11 rounded-md border border-border bg-background px-3 text-sm"
      />
      <input
        value={curator}
        onChange={(e) => setCurator(e.target.value)}
        placeholder="Curator"
        className="h-11 rounded-md border border-border bg-background px-3 text-sm"
      />
      <Button type="submit" className="md:col-span-2">
        Save mission
      </Button>
    </form>
  );
}
