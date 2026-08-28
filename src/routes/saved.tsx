import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PhotoMasonry } from "@/components/photo-card";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import type { Photo } from "@/lib/catalog";
import { useMe } from "@/lib/me";
import { listPhotos } from "@/lib/stella-api";

export const Route = createFileRoute("/saved")({ component: SavedPage });

function SavedPage() {
  const { user, isPending } = useCurrentUserState();
  const { me } = useMe();
  const [photos, setPhotos] = useState<Photo[]>([]);

  useEffect(() => {
    void listPhotos().then(setPhotos);
  }, []);

  if (isPending) {
    return (
      <div className="px-4 py-24 text-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }
  if (!user) return <RedirectToSignIn />;

  const saved = photos.filter((p) => me?.savedIds.includes(p.id));
  const following = photos.filter((p) =>
    me?.followedSlugs.includes(p.photographerSlug),
  );
  const mine = photos.filter((p) => p.photographerSlug === me?.slug);

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 md:px-6 md:py-12">
      <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
        Your roll
      </p>
      <h1 className="mt-1 font-serif text-4xl italic md:text-5xl">Saved</h1>
      <p className="mt-3 max-w-xl text-sm text-muted-foreground">
        Photographs you keep, and the people you follow. Tied to your account.
      </p>

      <section className="mt-10">
        <h2 className="font-serif text-2xl italic">Kept</h2>
        <div className="mt-6">
          {saved.length === 0 ? (
            <div className="border border-border bg-card px-6 py-14 text-center">
              <p className="font-serif text-2xl italic">Nothing saved</p>
              <Link
                to="/explore"
                className="mt-5 inline-flex h-11 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
              >
                Explore the catalog
              </Link>
            </div>
          ) : (
            <PhotoMasonry photos={saved} />
          )}
        </div>
      </section>

      <section className="mt-14">
        <h2 className="font-serif text-2xl italic">From people you follow</h2>
        <div className="mt-6">
          <PhotoMasonry photos={following} />
        </div>
      </section>

      {mine.length > 0 && (
        <section className="mt-14 pb-8">
          <h2 className="font-serif text-2xl italic">Uploaded</h2>
          <div className="mt-6">
            <PhotoMasonry photos={mine} />
          </div>
        </section>
      )}
    </div>
  );
}
