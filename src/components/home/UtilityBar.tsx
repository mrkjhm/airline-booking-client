import {
  Info,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Globe2,
  ChevronDown,
} from "lucide-react";

export function UtilityBar({ scrolled }: { scrolled: boolean }) {
  return (
    <div
      className={`hidden text-white transition-colors duration-300 md:block border-b- border-gray-200 ${scrolled ? "bg-secondary" : "bg-transparent"}`}
    >
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-2 text-xs">
        <div className="flex min-w-0 items-center gap-3">
          <Info className="h-4 w-4 shrink-0 text-primary" />
          <p className="truncate">
            <span className="font-bold">Travel Advisory:</span> Book by July 20 to lock in seat sale
            fares.
          </p>
          <div className="flex shrink-0 items-center gap-1 pl-1">
            <button
              aria-label="Previous advisory"
              className="grid h-5 w-5 place-items-center rounded-full text-white/60 hover:text-white"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              aria-label="Next advisory"
              className="grid h-5 w-5 place-items-center rounded-full text-white/60 hover:text-white"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <a href="#" className="shrink-0 font-semibold text-primary hover:opacity-80">
            View all
          </a>
        </div>

        <div className="flex shrink-0 items-center gap-5 pl-6">
          <button className="flex items-center gap-1.5 text-white/85 hover:text-white">
            <CircleDollarSign className="h-3.5 w-3.5" /> PHP <ChevronDown className="h-3 w-3" />
          </button>
          <button className="flex items-center gap-1.5 text-white/85 hover:text-white">
            <Globe2 className="h-3.5 w-3.5" /> English <ChevronDown className="h-3 w-3" />
          </button>
          <a href="#" className="font-semibold text-white hover:text-primary">
            Help
          </a>
        </div>
      </div>
    </div>
  );
}
