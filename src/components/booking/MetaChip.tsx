import type { LucideIcon } from "lucide-react";

export function MetaChip({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
      <Icon className="h-3 w-3 shrink-0" />
      {label}
    </span>
  );
}
