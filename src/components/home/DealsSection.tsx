import { useMemo, useState } from "react";
import { ChevronRight, Compass } from "lucide-react";
import tokyoImg from "@/assets/tokyo.jpg";
import newyorkImg from "@/assets/newyork.jpg";
import dubaiImg from "@/assets/dubai.jpg";
import planeImg from "@/assets/plane.jpg";
import { DealCard, type Deal } from "./DealCard";
import { SearchFlightModal } from "./SearchFlightModal";
import { useFlightLocations } from "@/hooks/use-flight-locations";
import { useFlightDeals } from "@/hooks/use-flight-deals";
import { getTodayInputValue } from "@/components/search/SearchFormFields";

const PREFERRED_HUBS = ["Manila", "Cebu", "Davao", "Clark"];
const DEAL_IMAGES = [tokyoImg, newyorkImg, dubaiImg, planeImg];

export function DealsSection() {
  const locations = useFlightLocations();
  const [selectedModalDestination, setSelectedModalDestination] = useState<string | null>(null);

  const originTabs = useMemo(() => {
    if (locations.length === 0) return [];
    const preferred = PREFERRED_HUBS.filter((hub) => locations.includes(hub));
    return preferred.length >= 2 ? preferred : locations.slice(0, 4);
  }, [locations]);

  const [selectedOrigin, setSelectedOrigin] = useState<string | null>(null);
  const activeOrigin = selectedOrigin ?? originTabs[0] ?? "";

  const { deals, isLoading } = useFlightDeals(activeOrigin);

  const displayDeals: Deal[] = deals.map((deal, index) => ({
    city: deal.toLocation,
    price: deal.price,
    img: DEAL_IMAGES[index % DEAL_IMAGES.length],
  }));

  const columns: Deal[][] = [[], [], []];
  displayDeals.forEach((deal, index) => {
    columns[index % 3].push(deal);
  });

  // The bento layout alternates tall/short cards per column so every column's
  // total height lines up. A "tall" card is worth 2 height units, "short" is 1;
  // columns that fall short of the tallest column get padded with filler cards.
  const isTallSlot = (columnIndex: number, rowIndex: number) =>
    columnIndex % 2 === 0 ? rowIndex === 0 : rowIndex === 1;

  type GridCell = { deal: Deal; tall: boolean } | { filler: true; tall: boolean };

  const columnUnits = columns.map((column, columnIndex) =>
    column.reduce((sum, _deal, rowIndex) => sum + (isTallSlot(columnIndex, rowIndex) ? 2 : 1), 0),
  );
  const targetUnits = Math.max(...columnUnits, 0);

  const grid: GridCell[][] = columns.map((column, columnIndex) => {
    const cells: GridCell[] = column.map((deal, rowIndex) => ({
      deal,
      tall: isTallSlot(columnIndex, rowIndex),
    }));

    let units = columnUnits[columnIndex];
    let rowIndex = column.length;

    while (units < targetUnits) {
      const tall = isTallSlot(columnIndex, rowIndex);
      cells.push({ filler: true, tall });
      units += tall ? 2 : 1;
      rowIndex += 1;
    }

    return cells;
  });

  const isModalOpen = selectedModalDestination !== null;
  const openExploreModal = () => setSelectedModalDestination("");

  if (originTabs.length === 0) {
    return null;
  }

  return (
    <section id="deals" className="mx-auto max-w-[1400px] px-6 py-10">
      <h2 className="text-center font-display text-3xl font-extrabold text-secondary sm:text-4xl">
        Book cheap flights from
      </h2>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-8">
        {originTabs.map((origin) => (
          <button
            key={origin}
            type="button"
            onClick={() => setSelectedOrigin(origin)}
            className={`border-b-2 pb-1 text-lg font-bold transition ${
              origin === activeOrigin
                ? "border-primary text-secondary"
                : "border-transparent text-muted-foreground hover:text-secondary"
            }`}
          >
            {origin}
          </button>
        ))}
      </div>

      {isLoading && (
        <p className="mt-10 text-center text-sm font-semibold text-muted-foreground">
          Loading deals...
        </p>
      )}

      {!isLoading && displayDeals.length === 0 && (
        <p className="mt-10 text-center text-sm font-semibold text-muted-foreground">
          No upcoming flights from {activeOrigin} yet.
        </p>
      )}

      {!isLoading && displayDeals.length > 0 && (
        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
          {grid.map((column, columnIndex) => (
            <div key={columnIndex} className="flex flex-col gap-5">
              {column.map((cell, rowIndex) => {
                if ("deal" in cell) {
                  return (
                    <DealCard
                      key={cell.deal.city}
                      deal={cell.deal}
                      tall={cell.tall}
                      onSelect={() => setSelectedModalDestination(cell.deal.city)}
                    />
                  );
                }

                return (
                  <button
                    key={`filler-${columnIndex}-${rowIndex}`}
                    type="button"
                    onClick={openExploreModal}
                    className={`group relative block h-56 w-full overflow-hidden rounded-lg text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg md:h-56
                    }`}
                  >
                    <img
                      src={planeImg}
                      alt="Explore more destinations"
                      loading="lazy"
                      className="h-full w-full object-cover brightness-[0.55] transition duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/10 to-transparent" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
                      <Compass className="h-6 w-6 text-primary transition group-hover:scale-110" />
                      <span className="flex items-center gap-1 font-display text-lg font-extrabold text-white">
                        Explore more destinations <ChevronRight className="h-4 w-4" />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}

      <p className="mt-6 text-sm font-semibold text-secondary">*One-way base fares</p>

      <SearchFlightModal
        open={isModalOpen}
        onClose={() => setSelectedModalDestination(null)}
        initialFromLocation={activeOrigin}
        initialToLocation={selectedModalDestination ?? ""}
        initialDepartureDate={getTodayInputValue()}
        initialReturnDate=""
      />
    </section>
  );
}
