import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { CATEGORIES, type Category } from "@/lib/catalog";
import { useMe } from "@/lib/me";
import { publishPhoto } from "@/lib/stella-api";
import { compressImageFile } from "@/lib/utils";

export const Route = createFileRoute("/upload")({ component: UploadPage });

function UploadPage() {
  const { user, isPending } = useCurrentUserState();
  const { refresh } = useMe();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<{ src: string; width: number; height: number } | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Category>("Street");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [camera, setCamera] = useState("");
  const [lens, setLens] = useState("");
  const [focal, setFocal] = useState("");
  const [aperture, setAperture] = useState("");
  const [shutter, setShutter] = useState("");
  const [iso, setIso] = useState("");

  if (isPending) {
    return (
      <div className="px-4 py-24 text-center text-sm text-muted-foreground">Loading…</div>
    );
  }
  if (!user) return <RedirectToSignIn />;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:py-12">
      <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Your roll</p>
      <h1 className="mt-1 font-serif text-4xl italic">Upload</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Publish a photograph to your Stella profile. It appears in Explore and on your page.
      </p>

      <form
        className="mt-8 space-y-5"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!preview) {
            toast("Choose a photograph first");
            return;
          }
          setBusy(true);
          try {
            await refresh();
            const result = await publishPhoto({
              data: {
                title,
                category,
                location,
                description,
                src: preview.src,
                width: preview.width,
                height: preview.height,
                camera,
                lens,
                focal,
                aperture,
                shutter,
                iso,
              },
            });
            toast("On the roll", { description: title || "Untitled" });
            navigate({ to: "/photo/$photoId", params: { photoId: result.id } });
          } catch (err) {
            toast(err instanceof Error ? err.message : "Could not publish");
          } finally {
            setBusy(false);
          }
        }}
      >
        <label className="block">
          <span className="mb-2 block text-sm text-muted-foreground">Photograph</span>
          <input
            type="file"
            accept="image/*"
            className="block w-full text-sm file:mr-3 file:h-11 file:rounded-md file:border-0 file:bg-primary file:px-4 file:text-sm file:font-medium file:text-primary-foreground"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setBusy(true);
              try {
                const next = await compressImageFile(file);
                setPreview(next);
                if (!title) {
                  setTitle(file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "));
                }
              } catch {
                toast("Could not read that file");
              } finally {
                setBusy(false);
              }
            }}
          />
        </label>

        {preview && (
          <div className="overflow-hidden bg-muted">
            <img src={preview.src} alt="" className="mx-auto max-h-80 object-contain" />
          </div>
        )}

        <Field label="Title" value={title} onChange={setTitle} required />
        <label className="block">
          <span className="mb-2 block text-sm text-muted-foreground">Category</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className="h-11 w-full rounded-md border border-border bg-card px-3 text-sm outline-none ring-ring focus:ring-2"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <Field label="Location" value={location} onChange={setLocation} />
        <label className="block">
          <span className="mb-2 block text-sm text-muted-foreground">Caption</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
            placeholder="What was happening when you made this?"
          />
        </label>

        <fieldset className="grid grid-cols-2 gap-3">
          <legend className="mb-2 text-sm text-muted-foreground">Exposure (optional)</legend>
          <Field label="Camera" value={camera} onChange={setCamera} />
          <Field label="Lens" value={lens} onChange={setLens} />
          <Field label="Focal" value={focal} onChange={setFocal} placeholder="35mm" />
          <Field label="Aperture" value={aperture} onChange={setAperture} placeholder="f/2.8" />
          <Field label="Shutter" value={shutter} onChange={setShutter} placeholder="1/250" />
          <Field label="ISO" value={iso} onChange={setIso} placeholder="400" />
        </fieldset>

        <Button type="submit" disabled={busy || !preview} className="w-full">
          {busy ? "Working…" : "Publish to your roll"}
        </Button>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-muted-foreground">{label}</span>
      <input
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-md border border-border bg-card px-3 text-sm outline-none ring-ring focus:ring-2"
      />
    </label>
  );
}
