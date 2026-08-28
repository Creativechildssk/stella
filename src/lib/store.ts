import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Category, Comment, Photo } from "@/lib/catalog";

export const DAILY_STARS = 5;
export type UploadDraft = Photo;

type StellaState = {
  starredIds: string[];
  savedIds: string[];
  followedSlugs: string[];
  starsLeft: number;
  starsDay: string;
  commentsByPhoto: Record<string, Comment[]>;
  uploads: Photo[];
  ensureDay: () => void;
  toggleStar: (photoId: string) => "ok" | "already" | "empty";
  toggleSave: (photoId: string) => void;
  toggleFollow: (slug: string) => void;
  addComment: (photoId: string, text: string) => void;
  addUpload: (photo: Photo) => void;
};

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export const useStella = create<StellaState>()(
  persist(
    (set, get) => ({
      starredIds: [],
      savedIds: [],
      followedSlugs: [],
      starsLeft: DAILY_STARS,
      starsDay: todayKey(),
      commentsByPhoto: {},
      uploads: [],
      ensureDay: () => {
        const key = todayKey();
        if (get().starsDay !== key) {
          set({ starsDay: key, starsLeft: DAILY_STARS });
        }
      },
      toggleStar: (photoId) => {
        get().ensureDay();
        const { starredIds, starsLeft } = get();
        if (starredIds.includes(photoId)) return "already";
        if (starsLeft <= 0) return "empty";
        set({
          starredIds: [...starredIds, photoId],
          starsLeft: starsLeft - 1,
        });
        return "ok";
      },
      toggleSave: (photoId) => {
        const { savedIds } = get();
        set({
          savedIds: savedIds.includes(photoId)
            ? savedIds.filter((id) => id !== photoId)
            : [...savedIds, photoId],
        });
      },
      toggleFollow: (slug) => {
        const { followedSlugs } = get();
        set({
          followedSlugs: followedSlugs.includes(slug)
            ? followedSlugs.filter((s) => s !== slug)
            : [...followedSlugs, slug],
        });
      },
      addComment: (photoId, text) => {
        const trimmed = text.trim();
        if (!trimmed) return;
        const comment: Comment = {
          id: `local-${Date.now()}`,
          author: "You",
          avatar: "",
          text: trimmed,
          createdAt: new Date().toISOString(),
        };
        const existing = get().commentsByPhoto[photoId] ?? [];
        set({
          commentsByPhoto: {
            ...get().commentsByPhoto,
            [photoId]: [...existing, comment],
          },
        });
      },
      addUpload: (photo) => {
        set({ uploads: [photo, ...get().uploads] });
      },
    }),
    { name: "stella-v1", skipHydration: true },
  ),
);

export function allPhotos(uploads: Photo[], catalog: Photo[]) {
  const ids = new Set(uploads.map((p) => p.id));
  return [...uploads, ...catalog.filter((p) => !ids.has(p.id))];
}

export function makeUpload(input: {
  title: string;
  category: Category;
  location: string;
  description: string;
  src: string;
  width: number;
  height: number;
  camera: string;
  lens: string;
  focal: string;
  aperture: string;
  shutter: string;
  iso: string;
}): Photo {
  const slug = input.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
  return {
    id: `you-${slug || "shot"}-${Date.now()}`,
    title: input.title.trim() || "Untitled",
    photographerSlug: "you",
    category: input.category,
    src: input.src,
    width: input.width,
    height: input.height,
    stars: 0,
    views: 1,
    location: input.location.trim() || "Somewhere",
    description: input.description.trim(),
    createdAt: new Date().toISOString(),
    camera: input.camera || "Unknown camera",
    lens: input.lens || "—",
    focal: input.focal || "—",
    aperture: input.aperture || "—",
    shutter: input.shutter || "—",
    iso: input.iso || "—",
    comments: [],
  };
}

export const youPhotographer = {
  slug: "you",
  name: "You",
  city: "Your city",
  country: "",
  bio: "Your roll on Stella. Photos you add live on this device.",
  avatar: "",
  cover: "",
  level: 1,
  followers: 0,
  following: 0,
  gear: [] as string[],
  joined: new Date().toISOString().slice(0, 10),
};
