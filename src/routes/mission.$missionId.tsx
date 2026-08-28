import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PhotoMasonry } from "@/components/photo-card";
import type { Mission, Photo } from "@/lib/catalog";
import { getMissionById } from "@/lib/stella-api";
import { daysLeft } from "@/lib/utils";

export const Route = createFileRoute("/mission/$missionId")({
  component: MissionPage,
});

function MissionPage() {
  const { missionId } = Route.useParams();
  const [mission, setMission] = useState<Mission | null | undefined>(undefined);
  const [photos, setPhotos] = useState<Photo[]>([]);

  useEffect(() => {
    void getMissionById({ data: missionId }).then((res) => {
      setMission(res?.mission ?? null);
      setPhotos(res?.photos ?? []);
    });
  }, [missionId]);

  if (mission === undefined) {
    return (
      <div className="px-4 py-24 text-center text-sm text-muted-foreground">
        Loading mission…
      </div>
    );
  }

  if (!mission) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <p className="font-serif text-3xl italic">Mission not found</p>
        <Link to="/missions" className="mt-6 inline-block text-sm underline">
          All missions
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="relative min-h-[42dvh] overflow-hidden bg-muted">
        <img src={mission.cover} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/55 to-background/20" />
        <div className="relative mx-auto flex min-h-[42dvh] max-w-[1400px] flex-col justify-end px-4 py-10 md:px-6">
          <p className="text-[11px] uppercase tracking-[0.22em] text-foreground/75">
            Mission · {mission.category}
          </p>
          <h1 className="mt-2 font-serif text-4xl italic md:text-6xl">{mission.title}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-foreground/85 md:text-base">
            {mission.brief}
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            Curated by {mission.curator} ·{" "}
            {daysLeft(mission.endsAt) === 0
              ? "Closes today"
              : `${daysLeft(mission.endsAt)} days left`}{" "}
            · {mission.prize}
          </p>
          <div className="mt-6">
            <Link
              to="/upload"
              className="inline-flex h-11 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
            >
              Enter from your roll
            </Link>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-[1400px] px-4 py-12 md:px-6">
        <h2 className="font-serif text-2xl italic">Shortlist</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {photos.length} photographs in conversation with the brief.
        </p>
        <div className="mt-8">
          <PhotoMasonry photos={photos} />
        </div>
      </div>
    </div>
  );
}
