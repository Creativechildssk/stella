import { cn } from "@/lib/utils";

export function StarMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-4", className)} aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 1.6 13.2 8.8 20.4 10 13.2 11.2 12 18.4 10.8 11.2 3.6 10 10.8 8.8 12 1.6Z"
      />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-baseline gap-1.5", className)}>
      <StarMark className="size-3.5 translate-y-[-1px] text-foreground" />
      <span className="font-serif text-[1.35rem] italic leading-none tracking-tight">
        Stella
      </span>
    </span>
  );
}
