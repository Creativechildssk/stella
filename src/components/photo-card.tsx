import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import type { Photo } from "@/lib/catalog";
import { cn, formatCount } from "@/lib/utils";

export function PhotoCard({
  photo,
  className,
  sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw",
}: {
  photo: Photo;
  className?: string;
  sizes?: string;
}) {
  const author = photo.photographerName ?? photo.photographerSlug;
  const src = photo.src.includes("images.unsplash.com")
    ? `${photo.src.split("?")[0]}?auto=format&fit=crop&w=900&q=75`
    : photo.src;

  return (
    <Link
      to="/photo/$photoId"
      params={{ photoId: photo.id }}
      className={cn(
        "group relative block overflow-hidden bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <div
        className="relative w-full"
        style={{ aspectRatio: `${photo.width} / ${photo.height}` }}
      >
        <img
          src={src}
          alt={photo.title}
          width={photo.width}
          height={photo.height}
          sizes={sizes}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/10 to-transparent opacity-0 transition-opacity duration-250 group-hover:opacity-100 group-focus-visible:opacity-100 max-md:opacity-100 max-md:from-background/70 max-md:via-transparent" />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3 opacity-0 transition-opacity duration-250 group-hover:opacity-100 group-focus-visible:opacity-100 max-md:opacity-100">
          <div className="min-w-0">
            <p className="truncate font-serif text-base italic leading-tight text-foreground">
              {photo.title}
            </p>
            <p className="truncate text-xs text-muted-foreground">{author}</p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 text-xs text-foreground">
            <Star className="size-3 fill-foreground" />
            {formatCount(photo.stars)}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function PhotoMasonry({
  photos,
  className,
}: {
  photos: Photo[];
  className?: string;
}) {
  if (photos.length === 0) {
    return (
      <div className="border border-border bg-card px-6 py-16 text-center">
        <p className="font-serif text-2xl italic">Nothing here yet</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Try another category, or give a star to lift work onto the feed.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("columns-2 gap-2 md:columns-3 md:gap-3 xl:columns-4", className)}>
      {photos.map((photo) => (
        <div key={photo.id} className="mb-2 break-inside-avoid md:mb-3">
          <PhotoCard photo={photo} />
        </div>
      ))}
    </div>
  );
}
