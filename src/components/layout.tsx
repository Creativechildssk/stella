import { Link, useRouterState } from "@tanstack/react-router";
import {
  Compass,
  Home,
  Plus,
  Bookmark,
  Search,
  Flag,
  Star,
  Shield,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Wordmark } from "@/components/wordmark";
import { SearchOverlay } from "@/components/search-overlay";
import { SignedIn, SignedOut, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useMe } from "@/lib/me";
import { DAILY_STARS } from "@/lib/stella-api";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Inspiration", icon: Home },
  { to: "/explore", label: "Explore", icon: Compass },
  { to: "/missions", label: "Missions", icon: Flag },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [searchOpen, setSearchOpen] = useState(false);
  const { me } = useMe();
  const starsLeft = me?.starsLeft ?? DAILY_STARS;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-3 px-4 md:h-16 md:px-6">
          <Link to="/" className="shrink-0" aria-label="Stella home">
            <Wordmark />
          </Link>
          <nav className="ml-4 hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "px-3 py-2 text-sm transition-colors",
                  pathname === item.to
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
            {me?.isSuperadmin && (
              <Link
                to="/admin"
                className={cn(
                  "px-3 py-2 text-sm",
                  pathname.startsWith("/admin")
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Admin
              </Link>
            )}
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <span className="mr-1 hidden items-center gap-1.5 text-xs text-muted-foreground sm:inline-flex">
              <Star className="size-3 fill-foreground text-foreground" />
              <span className="tabular-nums">{starsLeft}</span>
              <span>today</span>
            </span>
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="inline-flex size-11 items-center justify-center text-muted-foreground hover:text-foreground"
              aria-label="Search"
            >
              <Search className="size-5" />
            </button>
            <Link
              to="/saved"
              className={cn(
                "hidden size-11 items-center justify-center md:inline-flex",
                pathname === "/saved"
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
              aria-label="Saved"
            >
              <Bookmark className="size-5" />
            </Link>
            <Link
              to="/upload"
              className="ml-1 inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground"
            >
              <Plus className="size-4" />
              <span className="hidden sm:inline">Upload</span>
            </Link>
            <AuthSlot />
          </div>
        </div>
      </header>

      <main className="pb-24 md:pb-0">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-md md:hidden">
        <ul className="grid grid-cols-5">
          {[
            { to: "/", label: "Home", icon: Home },
            { to: "/explore", label: "Explore", icon: Compass },
            { to: "/missions", label: "Missions", icon: Flag },
            { to: "/saved", label: "Saved", icon: Bookmark },
            {
              to: me?.isSuperadmin ? "/admin" : "/upload",
              label: me?.isSuperadmin ? "Admin" : "Upload",
              icon: me?.isSuperadmin ? Shield : Plus,
            },
          ].map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={cn(
                    "flex min-h-14 flex-col items-center justify-center gap-0.5 text-[10px] tracking-wide",
                    active ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  <Icon className="size-5" strokeWidth={active ? 2.2 : 1.8} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}

function AuthSlot() {
  const { user, isPending } = useCurrentUserState();
  const { me } = useMe();
  if (isPending) {
    return <div className="size-8 shrink-0 animate-pulse rounded-full bg-muted" />;
  }
  return (
    <>
      <SignedOut>
        <Link
          to="/login"
          className="ml-1 inline-flex h-9 items-center rounded-md border border-border px-3 text-sm"
        >
          Sign in
        </Link>
      </SignedOut>
      <SignedIn>
        <div className="ml-2 hidden min-w-0 md:block">
          <UserButton />
        </div>
        {user && (
          <Link
            to="/photographer/$slug"
            params={{ slug: me?.slug ?? "me" }}
            className="ml-1 size-8 overflow-hidden rounded-full bg-muted md:hidden"
            aria-label="Your profile"
          >
            {user.profileImageUrl ? (
              <img src={user.profileImageUrl} alt="" className="size-8 object-cover" />
            ) : (
              <span className="grid size-8 place-items-center text-xs">
                {(user.displayName ?? "A").charAt(0)}
              </span>
            )}
          </Link>
        )}
      </SignedIn>
    </>
  );
}
