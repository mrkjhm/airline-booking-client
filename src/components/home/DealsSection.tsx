import { useState } from "react";
import { ChevronRight, Compass } from "lucide-react";
import cebuImg from "@/assets/place-cebu.jpg";
import iloiloImg from "@/assets/place-iloilo.jpg";
import japanImg from "@/assets/place-japan.jpg";
import manilaImg from "@/assets/place-manila.jpg";
import singaporeImg from "@/assets/place-singapore.jpg";
import siargaoImg from "@/assets/place-siargao.jpg";
import palawanImg from "@/assets/deal-palawan.jpg";
import exploreImg from "@/assets/deal-explore.jpg";
import { DealCard, type Deal } from "./DealCard";
import { SearchFlightModal } from "./SearchFlightModal";
import { useFlightLocations } from "@/hooks/use-flight-locations";
import { useFlightDeals } from "@/hooks/use-flight-deals";
import { getTodayInputValue } from "@/components/search/SearchFormFields";

// Exact-match photo per real destination name from the database, so each
// card's image actually depicts the place it's advertising. Any place not
// in this list (newly added to the DB) falls back to a generic PH photo
// rather than showing a mismatched image.
const CITY_IMAGES: Record<string, string> = {
  Cebu: cebuImg,
  "Ilo-ilo": iloiloImg,
  Japan: japanImg,
  Manila: manilaImg,
  Singapore: singaporeImg,
  Siargao: siargaoImg,
};
const FALLBACK_DEAL_IMAGE = palawanImg;

function getDealImage(city: string) {
  return CITY_IMAGES[city] ?? FALLBACK_DEAL_IMAGE;
}

type SelectedDeal = { fromLocation: string; toLocation: string };

const ORIGIN = "Manila";

export function DealsSection() {
  const locations = useFlightLocations();
  const [selectedDeal, setSelectedDeal] = useState<SelectedDeal | null>(null);

  // Deals only ever originate from Manila (the only PH departure hub in the
  // database), so every card here is a Manila -> somewhere route.
  const { deals, isLoading } = useFlightDeals([ORIGIN]);

  const displayDeals: Deal[] = deals.map((deal) => ({
    fromLocation: deal.fromLocation,
    city: deal.toLocation,
    price: deal.price,
    img: getDealImage(deal.toLocation),
  }));

  const columns: Deal[][] = [[], [], []];
  displayDeals.forEach((deal, index) => {
    columns[index % 3].push(deal);
  });

  // Real destinations from the database that aren't already shown as a deal
  // card, surfaced on the "Explore more" filler so it teases actual places
  // instead of being purely decorative.
  const shownCities = new Set(displayDeals.map((deal) => deal.city));
  const otherDestinations = locations.filter(
    (location) => location !== ORIGIN && !shownCities.has(location),
  );

  // Every column always renders exactly 2 slots (a tall one + a short one,
  // alternating which comes first per column) so every column's total height
  // is identical by construction — no height math, no rounding gaps. Any slot
  // without a real deal renders a filler card sized to that exact slot.
  const isTallSlot = (columnIndex: number, rowIndex: number) =>
    columnIndex % 2 === 0 ? rowIndex === 0 : rowIndex === 1;

  type GridCell = { deal: Deal; tall: boolean } | { filler: true; tall: boolean };

  const grid: GridCell[][] = columns.map((column, columnIndex) =>
    Array.from({ length: 2 }, (_, rowIndex): GridCell => {
      const deal = column[rowIndex];
      const tall = isTallSlot(columnIndex, rowIndex);
      return deal ? { deal, tall } : { filler: true, tall };
    }),
  );

  const isModalOpen = selectedDeal !== null;
  const openExploreModal = () => setSelectedDeal({ fromLocation: "", toLocation: "" });

  if (locations.length === 0) {
    return null;
  }

  return (
    <section id="deals" className="mx-auto max-w-[1400px] px-6 py-20">
      <h2 className="text-center font-display text-3xl font-extrabold text-secondary sm:text-4xl">
        Book cheap flights from {ORIGIN}
      </h2>

      {isLoading && (
        <p className="mt-10 text-center text-sm font-semibold text-muted-foreground">
          Loading deals...
        </p>
      )}

      {!isLoading && displayDeals.length === 0 && (
        <p className="mt-10 text-center text-sm font-semibold text-muted-foreground">
          No upcoming flights from {ORIGIN} yet.
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
                      key={`${cell.deal.fromLocation}-${cell.deal.city}`}
                      deal={cell.deal}
                      tall={cell.tall}
                      onSelect={() =>
                        setSelectedDeal({
                          fromLocation: cell.deal.fromLocation,
                          toLocation: cell.deal.city,
                        })
                      }
                    />
                  );
                }

                return (
                  <button
                    key={`filler-${columnIndex}-${rowIndex}`}
                    type="button"
                    onClick={openExploreModal}
                    className={`group relative block h-56 w-full overflow-hidden rounded-lg text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${
                      cell.tall ? "md:h-116" : "md:h-56"
                    }`}
                  >
                    <img
                      src={exploreImg}
                      alt="Explore more destinations"
                      loading="lazy"
                      className="h-full w-full object-cover brightness-[0.55] transition duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/10 to-transparent" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center">
                      <Compass className="h-6 w-6 text-primary transition group-hover:scale-110" />
                      <span className="flex items-center gap-1 font-display text-lg font-extrabold text-white">
                        Explore more destinations <ChevronRight className="h-4 w-4" />
                      </span>
                      {otherDestinations.length > 0 && (
                        <span className="text-xs font-semibold text-white/80">
                          {otherDestinations.slice(0, 3).join(", ")}
                          {otherDestinations.length > 3 ? " & more" : ""}
                        </span>
                      )}
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
        onClose={() => setSelectedDeal(null)}
        initialFromLocation={selectedDeal?.fromLocation ?? ""}
        initialToLocation={selectedDeal?.toLocation ?? ""}
        initialDepartureDate={getTodayInputValue()}
        initialReturnDate=""
      />
    </section>
  );
}
