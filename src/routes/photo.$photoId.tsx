import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Eye, MapPin, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { PhotoCard } from "@/components/photo-card";
import { FollowButton, SaveButton, StarButton } from "@/components/star-actions";
import { Button } from "@/components/ui/button";
import type { Photo, Photographer } from "@/lib/catalog";
import {
  addComment,
  adminDeleteComment,
  getPhotoById,
  getPhotographerBySlug,
  listPhotos,
} from "@/lib/stella-api";
import { useMe } from "@/lib/me";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { formatCount, formatDate } from "@/lib/utils";

export const Route = createFileRoute("/photo/$photoId")({
  component: PhotoPage,
});

function PhotoPage() {
  const { photoId } = Route.useParams();
  const { me, refresh } = useMe();
  const { user } = useCurrentUserState();
  const navigate = useNavigate();
  const [photo, setPhoto] = useState<Photo | null | undefined>(undefined);
  const [author, setAuthor] = useState<Photographer | null>(null);
  const [more, setMore] = useState<Photo[]>([]);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    let cancelled = false;
    void getPhotoById({ data: photoId }).then(async (p) => {
      if (cancelled) return;
      setPhoto(p);
      if (!p) return;
      const [person, all] = await Promise.all([
        getPhotographerBySlug({ data: p.photographerSlug }),
        listPhotos(),
      ]);
      if (cancelled) return;
      setAuthor(person?.photographer ?? null);
      setMore(
        all
          .filter(
            (x) =>
              x.id !== p.id &&
              (x.photographerSlug === p.photographerSlug ||
                x.category === p.category),
          )
          .slice(0, 6),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [photoId]);

  if (photo === undefined) {
    return (
      <div className="px-4 py-24 text-center text-sm text-muted-foreground">
        Opening photograph…
      </div>
    );
  }

  if (!photo) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <p className="font-serif text-3xl italic">Photograph missing</p>
        <Link to="/" className="mt-6 inline-block text-sm underline">
          Back to inspiration
        </Link>
      </div>
    );
  }

  const starCount = photo.stars + (me?.starredIds.includes(photo.id) ? 0 : 0);
  const exif = [
    { k: "Camera", v: photo.camera },
    { k: "Lens", v: photo.lens },
    { k: "Focal", v: photo.focal },
    { k: "Aperture", v: photo.aperture },
    { k: "Shutter", v: photo.shutter },
    { k: "ISO", v: photo.iso },
  ];

  return (
    <article>
      <div className="bg-background">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 py-3 md:px-6">
          <Link
            to="/explore"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Explore
          </Link>
          <span className="text-xs text-muted-foreground">{photo.category}</span>
        </div>
        <div className="bg-muted">
          <img
            src={
              photo.src.includes("images.unsplash.com")
                ? `${photo.src.split("?")[0]}?auto=format&fit=crop&w=2000&q=85`
                : photo.src
            }
            alt={photo.title}
            className="mx-auto max-h-[82dvh] w-full object-contain"
          />
        </div>
      </div>

      <div className="mx-auto grid max-w-[1400px] gap-10 px-4 py-10 md:grid-cols-[minmax(0,1fr)_320px] md:px-6 md:py-14">
        <div>
          <h1 className="font-serif text-4xl italic leading-tight md:text-5xl">
            {photo.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Star className="size-3.5 fill-foreground text-foreground" />
              <span className="tabular-nums text-foreground">
                {formatCount(starCount)}
              </span>
            </span>
            <span className="inline-flex items-center gap-1">
              <Eye className="size-3.5" />
              {formatCount(photo.views)}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" />
              {photo.location}
            </span>
            <span>{formatDate(photo.createdAt)}</span>
          </div>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-foreground/90">
            {photo.description}
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <StarButton photoId={photo.id} />
            <SaveButton photoId={photo.id} />
            {author && <FollowButton slug={author.slug} />}
          </div>

          <section className="mt-12">
            <h2 className="font-serif text-2xl italic">Critique</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Talk about the photograph, not the photographer.
            </p>
            <ul className="mt-6 space-y-6">
              {photo.comments.length === 0 && (
                <li className="text-sm text-muted-foreground">
                  Be the first to leave a note.
                </li>
              )}
              {photo.comments.map((c) => (
                <li key={c.id} className="flex gap-3">
                  {c.avatar ? (
                    <img
                      src={c.avatar}
                      alt=""
                      className="size-9 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs">
                      {c.author.slice(0, 1)}
                    </span>
                  )}
                  <div>
                    <p className="text-sm">
                      <span className="font-medium text-foreground">
                        {c.author}
                      </span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {formatDate(c.createdAt)}
                      </span>
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-foreground/85">
                      {c.text}
                    </p>
                    {me?.isSuperadmin && (
                      <button
                        type="button"
                        className="mt-1 text-xs text-muted-foreground hover:text-destructive"
                        onClick={async () => {
                          await adminDeleteComment({ data: c.id });
                          setPhoto({
                            ...photo,
                            comments: photo.comments.filter((x) => x.id !== c.id),
                          });
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <form
              className="mt-6"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!user) {
                  navigate({ to: "/login" });
                  return;
                }
                try {
                  const comment = await addComment({
                    data: { photoId: photo.id, text: draft },
                  });
                  if (comment) {
                    setPhoto({ ...photo, comments: [...photo.comments, comment] });
                    setDraft("");
                    await refresh();
                  }
                } catch {
                  navigate({ to: "/login" });
                }
              }}
            >
              <label className="sr-only" htmlFor="note">
                Leave a note
              </label>
              <textarea
                id="note"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={3}
                placeholder={
                  user
                    ? "What is the photograph doing?"
                    : "Sign in to leave a note"
                }
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
              />
              <Button type="submit" className="mt-2" disabled={!draft.trim()}>
                {user ? "Post note" : "Sign in to post"}
              </Button>
            </form>
          </section>
        </div>

        <aside className="space-y-8">
          {author && (
            <Link
              to="/photographer/$slug"
              params={{ slug: author.slug }}
              className="flex items-center gap-3"
            >
              {author.avatar ? (
                <img
                  src={author.avatar}
                  alt=""
                  className="size-14 rounded-full object-cover"
                />
              ) : (
                <span className="flex size-14 items-center justify-center rounded-full bg-muted font-serif italic">
                  {author.name.charAt(0)}
                </span>
              )}
              <span>
                <span className="block font-medium">{author.name}</span>
                <span className="text-sm text-muted-foreground">
                  {author.city}
                  {author.country ? `, ${author.country}` : ""} · Level{" "}
                  {author.level}
                </span>
              </span>
            </Link>
          )}

          <div>
            <h2 className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              Exposure
            </h2>
            <dl className="mt-3 divide-y divide-border border-y border-border">
              {exif.map((row) => (
                <div
                  key={row.k}
                  className="flex items-baseline justify-between gap-4 py-2.5 text-sm"
                >
                  <dt className="text-muted-foreground">{row.k}</dt>
                  <dd className="text-right tabular-nums">{row.v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </aside>
      </div>

      {more.length > 0 && (
        <section className="border-t border-border">
          <div className="mx-auto max-w-[1400px] px-4 py-12 md:px-6">
            <h2 className="font-serif text-2xl italic">More in this room</h2>
            <div className="mt-6 grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-3">
              {more.map((p) => (
                <PhotoCard key={p.id} photo={p} />
              ))}
            </div>
          </div>
        </section>
      )}
    </article>
  );
}
