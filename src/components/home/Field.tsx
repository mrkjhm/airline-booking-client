import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

export function Field({ icon, label, value, sub }: { icon: ReactNode; label: string; value: string; sub?: string }) {
  return (
    <button className="group flex flex-col rounded-xl border border-border bg-muted/60 px-4 py-3 text-left transition hover:border-primary">
      <div className="flex items-center justify-between gap-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
        <span className="flex items-center gap-1.5">{icon} {label}</span>
        <ChevronDown className="h-3.5 w-3.5 opacity-60" />
      </div>
      <p className="mt-1.5 font-display text-base font-extrabold leading-none text-secondary">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </button>
  );
}
