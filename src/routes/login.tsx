import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { GROK_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/wordmark";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onEmail(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "up") {
        const res = await authClient.signUp.email({
          email,
          password,
          name: name.trim() || email.split("@")[0] || "Member",
        });
        if (res.error) throw new Error(res.error.message || "Could not create account");
      } else {
        const res = await authClient.signIn.email({ email, password });
        if (res.error) throw new Error(res.error.message || "Could not sign in");
      }
      window.location.assign("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70dvh] max-w-md flex-col justify-center px-4 py-12">
      <Link to="/" className="self-start">
        <Wordmark />
      </Link>
      <h1 className="mt-8 font-serif text-4xl italic">Enter Stella</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Sign in to give stars, follow photographers, upload, and — if you are
        the first member — become superadmin.
      </p>

      {!authEnabled ? (
        <p className="mt-8 text-sm text-muted-foreground">Sign-in is disabled.</p>
      ) : (
        <>
          <div className="mt-8 space-y-2">
            {GROK_PROVIDERS.map((p) => (
              <button
                key={p.providerId}
                type="button"
                onClick={() => signIn(p.providerId, { callbackURL: "/" })}
                className="flex h-11 w-full items-center justify-center rounded-md border border-border bg-card text-sm hover:bg-accent"
              >
                Continue with {p.label}
              </button>
            ))}
          </div>

          <p className="my-6 text-center text-xs uppercase tracking-[0.2em] text-muted-foreground">
            or email
          </p>

          <form className="space-y-3" onSubmit={onEmail}>
            {mode === "up" && (
              <label className="block">
                <span className="mb-1.5 block text-sm text-muted-foreground">Name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-11 w-full rounded-md border border-border bg-card px-3 text-sm outline-none ring-ring focus:ring-2"
                />
              </label>
            )}
            <label className="block">
              <span className="mb-1.5 block text-sm text-muted-foreground">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 w-full rounded-md border border-border bg-card px-3 text-sm outline-none ring-ring focus:ring-2"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm text-muted-foreground">Password</span>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 w-full rounded-md border border-border bg-card px-3 text-sm outline-none ring-ring focus:ring-2"
              />
            </label>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Working…" : mode === "up" ? "Create account" : "Sign in"}
            </Button>
          </form>
          <button
            type="button"
            className="mt-4 text-sm text-muted-foreground hover:text-foreground"
            onClick={() => setMode(mode === "up" ? "in" : "up")}
          >
            {mode === "up"
              ? "Already have an account? Sign in"
              : "New here? Create an account"}
          </button>
        </>
      )}
    </div>
  );
}
