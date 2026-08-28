import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PhotoMasonry } from "@/components/photo-card";
import { CATEGORIES, type Category, type Photo } from "@/lib/catalog";
import { listPhotos } from "@/lib/stella-api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/explore")({ component: Explore });

const SORTS = [
  { id: "inspired", label: "Most inspired" },
  { id: "latest", label: "Latest" },
  { id: "views", label: "Most viewed" },
] as const;

function Explore() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [category, setCategory] = useState<Category | "All">("All");
  const [sort, setSort] = useState<(typeof SORTS)[number]["id"]>("inspired");

  useEffect(() => {
    void listPhotos().then(setPhotos);
  }, []);

  const list = useMemo(() => {
    let pool = photos;
    if (category !== "All") pool = pool.filter((p) => p.category === category);
    const sorted = [...pool];
    if (sort === "latest") {
      sorted.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    } else if (sort === "views") {
      sorted.sort((a, b) => b.views - a.views);
    } else {
      sorted.sort((a, b) => b.stars - a.stars);
    }
    return sorted;
  }, [photos, category, sort]);

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 md:px-6 md:py-12">
      <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
        Browse
      </p>
      <h1 className="mt-1 font-serif text-4xl italic md:text-5xl">Explore</h1>
      <p className="mt-3 max-w-xl text-sm text-muted-foreground">
        The whole catalog, by craft. Filter by what you shoot, sort by what
        the community has lifted.
      </p>

      <div className="mt-8 flex gap-2 overflow-x-auto pb-2">
        {(["All", ...CATEGORIES] as const).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={cn(
              "h-10 shrink-0 rounded-full border px-4 text-sm",
              category === c
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mt-4 flex gap-1">
        {SORTS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSort(s.id)}
            className={cn(
              "h-9 px-3 text-sm",
              sort === s.id
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      <p className="mt-2 text-xs tabular-nums text-muted-foreground">
        {list.length} photographs
      </p>

      <div className="mt-6">
        <PhotoMasonry photos={list} />
      </div>
    </div>
  );
}
