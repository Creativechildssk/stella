import { Bookmark, Star, UserPlus, UserCheck } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useMe } from "@/lib/me";
import { DAILY_STARS, starPhoto, toggleFollow, toggleSave } from "@/lib/stella-api";
import { cn } from "@/lib/utils";

function useRequireSignIn() {
  const navigate = useNavigate();
  const { user, isPending } = useCurrentUserState();
  return () => {
    if (isPending) return false;
    if (!user) {
      navigate({ to: "/login" });
      return false;
    }
    return true;
  };
}

export function StarButton({
  photoId,
  className,
}: {
  photoId: string;
  className?: string;
}) {
  const { me, refresh } = useMe();
  const requireSignIn = useRequireSignIn();
  const starred = Boolean(me?.starredIds.includes(photoId));
  return (
    <Button
      variant={starred ? "default" : "outline"}
      className={className}
      onClick={async () => {
        if (!requireSignIn()) return;
        try {
          const result = await starPhoto({ data: photoId });
          if (result.ok) {
            toast("Star given", {
              description: `${result.remaining} of ${DAILY_STARS} remaining today.`,
            });
            await refresh();
          } else if (result.reason === "already") {
            toast("Already starred", {
              description: "Stars lift a photograph onto the Inspiration feed. They stay.",
            });
          } else {
            toast("No stars left today", {
              description: "Stella gives you five stars a day. Come back after midnight.",
            });
          }
        } catch {
          toast("Could not star this photograph");
        }
      }}
    >
      <Star className={cn("size-4", starred && "fill-primary-foreground")} />
      {starred ? "Starred" : "Give a star"}
    </Button>
  );
}

export function SaveButton({ photoId }: { photoId: string }) {
  const { me, refresh } = useMe();
  const requireSignIn = useRequireSignIn();
  const saved = Boolean(me?.savedIds.includes(photoId));
  return (
    <Button
      variant="outline"
      onClick={async () => {
        if (!requireSignIn()) return;
        try {
          const result = await toggleSave({ data: photoId });
          toast(result.saved ? "Saved to your roll" : "Removed from saved");
          await refresh();
        } catch {
          toast("Could not save");
        }
      }}
      aria-label={saved ? "Unsave" : "Save"}
    >
      <Bookmark className={cn("size-4", saved && "fill-foreground")} />
      {saved ? "Saved" : "Save"}
    </Button>
  );
}

export function FollowButton({ slug }: { slug: string }) {
  const { me, refresh } = useMe();
  const requireSignIn = useRequireSignIn();
  const followed = Boolean(me?.followedSlugs.includes(slug));
  if (slug === me?.slug) return null;
  return (
    <Button
      variant={followed ? "secondary" : "default"}
      onClick={async () => {
        if (!requireSignIn()) return;
        try {
          const result = await toggleFollow({ data: slug });
          toast(result.followed ? "Following" : "Unfollowed");
          await refresh();
        } catch {
          toast("Could not follow");
        }
      }}
    >
      {followed ? <UserCheck className="size-4" /> : <UserPlus className="size-4" />}
      {followed ? "Following" : "Follow"}
    </Button>
  );
}
