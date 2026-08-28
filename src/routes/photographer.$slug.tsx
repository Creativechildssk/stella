import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PhotoMasonry } from "@/components/photo-card";
import { FollowButton } from "@/components/star-actions";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth/client";
import type { Photo, Photographer } from "@/lib/catalog";
import { getPhotographerBySlug } from "@/lib/stella-api";
import { useMe } from "@/lib/me";
import { formatCount } from "@/lib/utils";

export const Route = createFileRoute("/photographer/$slug")({
  component: PhotographerPage,
});

function PhotographerPage() {
  const { slug } = Route.useParams();
  const { me } = useMe();
  const [person, setPerson] = useState<Photographer | null | undefined>(undefined);
  const [work, setWork] = useState<Photo[]>([]);
  const followed = Boolean(me?.followedSlugs.includes(slug));

  useEffect(() => {
    void getPhotographerBySlug({ data: slug }).then((res) => {
      setPerson(res?.photographer ?? null);
      setWork(res?.photos ?? []);
    });
  }, [slug]);

  if (person === undefined) {
    return (
      <div className="px-4 py-24 text-center text-sm text-muted-foreground">
        Loading photographer…
      </div>
    );
  }

  if (!person) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <p className="font-serif text-3xl italic">Photographer not found</p>
        <Link to="/explore" className="mt-6 inline-block text-sm underline">
          Explore instead
        </Link>
      </div>
    );
  }

  const cover = person.cover || work[0]?.src || "";

  return (
    <div>
      <div className="relative h-56 overflow-hidden bg-muted md:h-80">
        {cover ? <img src={cover} alt="" className="h-full w-full object-cover" /> : null}
        <div className="absolute inset-0 bg-gradient-to-t from-background to-background/10" />
      </div>
      <div className="mx-auto max-w-[1400px] px-4 md:px-6">
        <div className="-mt-12 flex flex-col gap-4 md:-mt-16 md:flex-row md:items-end md:justify-between">
          <div className="flex items-end gap-4">
            {person.avatar ? (
              <img
                src={person.avatar}
                alt=""
                className="size-24 rounded-full object-cover ring-4 ring-background md:size-28"
              />
            ) : (
              <span className="flex size-24 items-center justify-center rounded-full bg-card font-serif text-3xl italic ring-4 ring-background md:size-28">
                {person.name.charAt(0)}
              </span>
            )}
            <div className="pb-1">
              <h1 className="font-serif text-3xl italic md:text-4xl">{person.name}</h1>
              <p className="text-sm text-muted-foreground">
                {person.city}
                {person.country ? `, ${person.country}` : ""} · Level {person.level}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pb-1">
            <FollowButton slug={person.slug} />
            {me?.slug === person.slug && (
              <Button variant="outline" onClick={() => void signOut().catch(() => undefined)}>
                Sign out
              </Button>
            )}
          </div>
        </div>

        <p className="mt-6 max-w-2xl text-sm leading-relaxed text-foreground/85 md:text-base">
          {person.bio}
        </p>

        <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-sm">
          <div>
            <dt className="text-muted-foreground">Followers</dt>
            <dd className="tabular-nums">{formatCount(person.followers + (followed ? 0 : 0))}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Following</dt>
            <dd className="tabular-nums">{formatCount(person.following)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Photographs</dt>
            <dd className="tabular-nums">{work.length}</dd>
          </div>
        </dl>

        {person.gear.length > 0 && (
          <div className="mt-8">
            <h2 className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              In the bag
            </h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {person.gear.map((g) => (
                <li key={g} className="rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground">
                  {g}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-12 pb-16">
          <h2 className="font-serif text-2xl italic">Portfolio</h2>
          <div className="mt-6">
            <PhotoMasonry photos={work} />
          </div>
        </div>
      </div>
    </div>
  );
}
