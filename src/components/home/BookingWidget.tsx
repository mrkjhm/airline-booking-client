import { Search, Plane, ArrowLeftRight, X, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Route as IndexRoute } from "@/routes/index";
import { getTodayInputValue } from "@/components/search/SearchFormFields";
import { useFlightLocations } from "@/hooks/use-flight-locations";
import { SearchFlightModal } from "./SearchFlightModal";

const quickPicks = ["Top Picks for You", "Puerto Princesa", "Sydney", "Hong Kong"];

function filterLocations(options: string[], query: string, excludeValues: string[]) {
  const normalizedExcluded = excludeValues
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  const normalizedQuery = query.trim().toLowerCase();

  return options.filter((option) => {
    if (normalizedExcluded.includes(option.toLowerCase())) return false;
    return !normalizedQuery || option.toLowerCase().includes(normalizedQuery);
  });
}

export function BookingWidget() {
  const search = IndexRoute.useSearch();
  const locations = useFlightLocations();
  const [fromLocation, setFromLocation] = useState(search.fromLocation ?? "Manila");
  const [toLocation, setToLocation] = useState(search.toLocation ?? "");
  const [departureDate, setDepartureDate] = useState(search.departureDate ?? getTodayInputValue());
  const [returnDate, setReturnDate] = useState(search.returnDate ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFromOpen, setIsFromOpen] = useState(false);
  const [isToOpen, setIsToOpen] = useState(false);
  const [fromQuery, setFromQuery] = useState("");
  const [toQuery, setToQuery] = useState("");
  const fromFieldRef = useRef<HTMLDivElement>(null);
  const toFieldRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fromFieldRef.current && !fromFieldRef.current.contains(event.target as Node)) {
        setIsFromOpen(false);
      }
      if (toFieldRef.current && !toFieldRef.current.contains(event.target as Node)) {
        setIsToOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fromOptions = filterLocations(locations, fromQuery, [toLocation, fromLocation]);
  const toOptions = filterLocations(locations, toQuery, [fromLocation, toLocation]);

  useEffect(() => {
    setFromLocation(search.fromLocation ?? "Manila");
    setToLocation(search.toLocation ?? "");
    setDepartureDate(search.departureDate ?? getTodayInputValue());
    setReturnDate(search.returnDate ?? "");
  }, [search]);

  const handleSwapLocations = () => {
    setFromLocation(toLocation);
    setToLocation(fromLocation);
  };

  const handleQuickPick = (destination: string) => {
    if (destination === "Top Picks for You") return;
    setToLocation(destination);
    setError(null);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsModalOpen(true);
  };

  return (
    <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
      <div className="relative z-10 -mt-16 rounded-2xl bg-black/15 p-4 shadow-[0_20px_60px_-15px_rgba(10,23,48,0.45)] backdrop-blur-sm sm:-mt-20 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          {quickPicks.map((p, i) => (
            <button
              key={p}
              type="button"
              onClick={() => handleQuickPick(p)}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
                i === 0 || toLocation === p
                  ? "bg-primary text-secondary"
                  : "bg-white text-secondary hover:bg-white/90"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-secondary">
              <Plane className="h-4 w-4 -rotate-45" />
            </span>
            <span className="font-display text-base font-extrabold text-white">Flight</span>
          </div>

          <button
            type="button"
            className="flex items-center gap-1 text-sm font-bold text-white hover:text-primary"
          >
            Round-trip <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-stretch"
        >
          <div className="grid flex-1 grid-cols-2 rounded-2xl bg-white sm:grid-cols-4">
            <div ref={fromFieldRef} className="relative flex flex-col px-5 py-4 text-left">
              <span className="flex items-center justify-between gap-2 text-xs font-semibold text-muted-foreground">
                From
                <button
                  type="button"
                  onClick={() => {
                    setFromLocation("");
                    setToLocation("");
                    setFromQuery("");
                    setToQuery("");
                    setError(null);
                  }}
                  aria-label="Clear origin"
                  className="text-muted-foreground/70 hover:text-secondary"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
              <input
                value={fromLocation}
                onChange={(event) => {
                  setFromLocation(event.target.value);
                  setFromQuery(event.target.value);
                  setError(null);
                  setIsFromOpen(true);
                }}
                onFocus={() => {
                  setFromQuery("");
                  setIsFromOpen(true);
                }}
                placeholder="Origin city"
                className="mt-1 bg-transparent font-display text-base font-extrabold text-slate-800 outline-none placeholder:text-muted-foreground/50"
              />

              {isFromOpen && fromOptions.length > 0 && (
                <ul className="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-y-auto rounded-md border border-border bg-white py-1 shadow-lg">
                  {fromOptions.map((option) => (
                    <li key={option}>
                      <button
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                          setFromLocation(option);
                          setIsFromOpen(false);
                          setError(null);
                        }}
                        className="block w-full px-4 py-2 text-left text-sm font-medium text-slate-800 hover:bg-muted"
                      >
                        {option}
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <button
                type="button"
                onClick={handleSwapLocations}
                aria-label="Swap origin and destination"
                className="absolute right-0 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 translate-x-1/2 place-items-center rounded-full border border-border bg-white text-secondary shadow-sm transition hover:border-secondary sm:grid"
              >
                <ArrowLeftRight className="h-4 w-4" />
              </button>
            </div>

            <div
              ref={toFieldRef}
              className="relative flex flex-col border-l border-border px-5 py-4 text-left"
            >
              <span className="flex items-center justify-between gap-2 text-xs font-semibold text-muted-foreground">
                To
                <button
                  type="button"
                  onClick={() => {
                    setToLocation("");
                    setToQuery("");
                    setError(null);
                  }}
                  aria-label="Clear destination"
                  className="text-muted-foreground/70 hover:text-secondary"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
              <input
                value={toLocation}
                onFocus={() => {
                  setToQuery("");
                  setIsToOpen(true);
                }}
                onChange={(event) => {
                  setToLocation(event.target.value);
                  setToQuery(event.target.value);
                  setError(null);
                  setIsToOpen(true);
                }}
                placeholder="Select Destination"
                className="mt-1 bg-transparent font-display text-base font-extrabold text-slate-800 outline-none placeholder:text-muted-foreground/50"
              />

              {isToOpen && toOptions.length > 0 && (
                <ul className="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-y-auto rounded-md border border-border bg-white py-1 shadow-lg">
                  {toOptions.map((option) => (
                    <li key={option}>
                      <button
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                          setToLocation(option);
                          setIsToOpen(false);
                          setError(null);
                        }}
                        className="block w-full px-4 py-2 text-left text-sm font-medium text-slate-800 hover:bg-muted"
                      >
                        {option}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex flex-col border-t border-border px-5 py-4 text-left sm:border-l sm:border-t-0">
              <span className="text-xs font-semibold text-muted-foreground">Depart</span>
              <input
                type="date"
                value={departureDate}
                min={getTodayInputValue()}
                onChange={(event) => {
                  setDepartureDate(event.target.value);
                  setError(null);
                }}
                className="mt-1 bg-transparent font-display text-base font-extrabold text-slate-800 outline-none"
              />
            </div>

            <div className="flex flex-col border-t border-border px-5 py-4 text-left sm:border-l sm:border-t-0">
              <span className="text-xs font-semibold text-muted-foreground">Return</span>
              <input
                type="date"
                value={returnDate}
                min={departureDate || getTodayInputValue()}
                placeholder="Returning on"
                onChange={(event) => {
                  setReturnDate(event.target.value);
                  setError(null);
                }}
                className="mt-1 bg-transparent font-display text-base font-extrabold text-slate-800 outline-none placeholder:text-muted-foreground/50"
              />
            </div>
          </div>

          <button
            type="submit"
            className="flex items-center justify-center gap-2 rounded-full bg-secondary px-8 py-4 font-display text-base font-extrabold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Search className="h-4 w-4" />
            Search flights
          </button>
        </form>

        {error && <p className="mt-3 text-sm font-semibold text-accent">{error}</p>}
      </div>

      <SearchFlightModal
        open={isModalOpen}
        onClose={(values) => {
          setFromLocation(values.fromLocation);
          setToLocation(values.toLocation);
          setDepartureDate(values.departureDate);
          setReturnDate(values.returnDate);
          setIsModalOpen(false);
        }}
        initialFromLocation={fromLocation}
        initialToLocation={toLocation}
        initialDepartureDate={departureDate}
        initialReturnDate={returnDate}
      />
    </div>
  );
}
