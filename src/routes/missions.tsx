import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { Mission } from "@/lib/catalog";
import { listMissions } from "@/lib/stella-api";
import { daysLeft } from "@/lib/utils";

export const Route = createFileRoute("/missions")({ component: MissionsPage });

function MissionsPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  useEffect(() => {
    void listMissions().then(setMissions);
  }, []);

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 md:px-6 md:py-12">
      <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
        Assignments
      </p>
      <h1 className="mt-1 font-serif text-4xl italic md:text-5xl">Missions</h1>
      <p className="mt-3 max-w-xl text-sm text-muted-foreground">
        Time-boxed briefs from working photographers. Enter from your roll,
        or study the shortlist.
      </p>
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {missions.map((m) => (
          <Link
            key={m.id}
            to="/mission/$missionId"
            params={{ missionId: m.id }}
            className="group relative min-h-72 overflow-hidden bg-muted"
          >
            <img
              src={m.cover}
              alt=""
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
            <div className="relative flex h-full min-h-72 flex-col justify-end p-6">
              <p className="text-[11px] uppercase tracking-wider text-foreground/70">
                {daysLeft(m.endsAt) === 0
                  ? "Closing"
                  : `${daysLeft(m.endsAt)} days left`}{" "}
                · {m.category} · {m.entries.length} entries
              </p>
              <h2 className="mt-2 font-serif text-3xl italic">{m.title}</h2>
              <p className="mt-2 line-clamp-3 text-sm text-foreground/80">
                {m.brief}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                Curated by {m.curator}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
