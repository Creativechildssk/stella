import { Link } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { searchStella } from "@/lib/stella-api";
import type { Photo, Photographer } from "@/lib/catalog";
import { cn } from "@/lib/utils";

export function SearchOverlay({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [people, setPeople] = useState<Photographer[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQ("");
      setPhotos([]);
      setPeople([]);
      const t = window.setTimeout(() => inputRef.current?.focus(), 20);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!q.trim()) {
      setPhotos([]);
      setPeople([]);
      return;
    }
    const handle = window.setTimeout(() => {
      void searchStella({ data: q }).then((res) => {
        setPhotos(res.photos);
        setPeople(res.photographers);
      });
    }, 180);
    return () => window.clearTimeout(handle);
  }, [q]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        aria-label="Close search"
        onClick={onClose}
      />
      <div className="relative mx-auto mt-16 w-full max-w-xl px-4">
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-2xl">
          <div className="flex items-center gap-2 border-b border-border px-3">
            <Search className="size-4 text-muted-foreground" />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search photos, places, photographers"
              className="h-12 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            <button
              type="button"
              onClick={onClose}
              className="size-11 text-muted-foreground hover:text-foreground"
              aria-label="Close"
            >
              <X className="mx-auto size-4" />
            </button>
          </div>
          <div className="max-h-[60vh] overflow-y-auto p-2">
            {!q.trim() ? (
              <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                Try “Kyoto”, “Leica”, or a photographer’s name.
              </p>
            ) : photos.length === 0 && people.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                No matches for “{q}”.
              </p>
            ) : (
              <div className="flex flex-col gap-3 p-1">
                {people.length > 0 && (
                  <div>
                    <p className="px-2 pb-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                      Photographers
                    </p>
                    {people.map((p) => (
                      <Link
                        key={p.slug}
                        to="/photographer/$slug"
                        params={{ slug: p.slug }}
                        onClick={onClose}
                        className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-accent"
                      >
                        {p.avatar ? (
                          <img src={p.avatar} alt="" className="size-9 rounded-full object-cover" />
                        ) : (
                          <span className="grid size-9 place-items-center rounded-full bg-muted text-xs">
                            {p.name.charAt(0)}
                          </span>
                        )}
                        <span>
                          <span className="block text-sm">{p.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {p.city}
                            {p.country ? `, ${p.country}` : ""}
                          </span>
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
                {photos.length > 0 && (
                  <div>
                    <p className="px-2 pb-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                      Photographs
                    </p>
                    {photos.map((p) => (
                      <Link
                        key={p.id}
                        to="/photo/$photoId"
                        params={{ photoId: p.id }}
                        onClick={onClose}
                        className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-accent"
                      >
                        <img src={p.src} alt="" className="size-12 rounded-sm object-cover" />
                        <span>
                          <span className="block font-serif italic">{p.title}</span>
                          <span className="text-xs text-muted-foreground">
                            {p.category} · {p.location}
                          </span>
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
