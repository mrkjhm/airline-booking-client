import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Luggage,
  Plane,
  UserRound,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { searchFlights, type FlightSearchResult } from "@/lib/search-flight";
import { getTodayInputValue } from "@/components/search/SearchFormFields";
import { Header } from "@/components/home/Header";

type SearchFlightRouteSearch = {
  fromLocation?: string;
  toLocation?: string;
  departureDate?: string;
  returnDate?: string;
  passengers?: number;
  adults?: number;
  children?: number;
  infants?: number;
  promoCode?: string;
};

export const Route = createFileRoute("/search-flight")({
  validateSearch: (search: Record<string, unknown>): SearchFlightRouteSearch => ({
    fromLocation: parseString(search.fromLocation),
    toLocation: parseString(search.toLocation),
    departureDate: parseString(search.departureDate),
    returnDate: parseString(search.returnDate),
    passengers: parsePositiveInt(search.passengers),
    adults: parsePositiveInt(search.adults),
    children: parseNonNegativeInt(search.children),
    infants: parseNonNegativeInt(search.infants),
    promoCode: parseString(search.promoCode),
  }),
  component: SearchFlightPage,
  head: () => ({
    meta: [{ title: "Search Flight - SunJet" }],
  }),
});

const steps = [
  { label: "Select Flight", icon: Plane },
  { label: "Guest Details", icon: UserRound },
  { label: "Add-ons", icon: Luggage },
  { label: "Payment", icon: CreditCard },
  { label: "Confirmation", icon: Check },
];

function SearchFlightPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const fromLocation = search.fromLocation ?? "";
  const toLocation = search.toLocation ?? "";
  const adults = Math.max(1, search.adults ?? search.passengers ?? 1);
  const children = search.children ?? 0;
  const infants = search.infants ?? 0;
  const passengerCount = Math.max(1, adults + children);

  const [outboundDate, setOutboundDate] = useState(search.departureDate ?? "");
  const [returnLegDate, setReturnLegDate] = useState(search.returnDate ?? "");

  const outbound = useFlightLegSearch();
  const returnLeg = useFlightLegSearch();

  useEffect(() => {
    setOutboundDate(search.departureDate ?? "");
    setReturnLegDate(search.returnDate ?? "");
  }, [search.departureDate, search.returnDate]);

  useEffect(() => {
    if (fromLocation && toLocation && outboundDate) {
      void outbound.run({
        fromLocation,
        toLocation,
        departureDate: outboundDate,
        passengers: passengerCount,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromLocation, toLocation, outboundDate, passengerCount]);

  useEffect(() => {
    if (fromLocation && toLocation && returnLegDate) {
      void returnLeg.run({
        fromLocation: toLocation,
        toLocation: fromLocation,
        departureDate: returnLegDate,
        passengers: passengerCount,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromLocation, toLocation, returnLegDate, passengerCount]);

  const handleEditSearch = () => {
    void navigate({ to: "/" });
  };

  const canContinue = Boolean(outbound.selectedId && returnLeg.selectedId);

  if (!fromLocation || !toLocation || !outboundDate || !returnLegDate) {
    return (
      <div className="min-h-screen bg-[#f5f6f8]">
        <Header />
        <main className="flex min-h-screen items-center justify-center px-6 pt-32 text-center">
          <div>
            <p className="text-lg font-bold text-[#30343b]">No search details found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Go back home and search for a flight first.
            </p>
            <button
              type="button"
              onClick={handleEditSearch}
              className="mt-6 rounded-full bg-secondary px-6 py-3 text-sm font-extrabold text-white transition hover:brightness-110"
            >
              Back to homepage
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f6f8] text-[#2f333a]">
      <Header />

      <main className="pt-32">
        <div className="border-b border-border bg-white">
          <div className="mx-auto flex max-w-[1546px] flex-wrap items-center justify-between gap-4 px-6 py-4 sm:px-10 lg:px-16">
            <div className="flex flex-wrap items-center gap-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Departing Flight
                </p>
                <p className="text-sm font-extrabold text-[#30343b]">
                  {fromLocation} To {toLocation}
                </p>
                <p className="text-xs font-semibold text-secondary">
                  {formatShortDate(outboundDate)}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Returning Flight
                </p>
                <p className="text-sm font-extrabold text-[#30343b]">
                  {toLocation} To {fromLocation}
                </p>
                <p className="text-xs font-semibold text-secondary">
                  {formatShortDate(returnLegDate)}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Guests
                </p>
                <p className="text-sm font-extrabold text-[#30343b]">
                  {formatGuestsLabel(adults, children, infants)}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleEditSearch}
              className="rounded-full border border-secondary px-5 py-2 text-sm font-extrabold text-secondary transition hover:bg-secondary/10"
            >
              Edit Search
            </button>
          </div>
        </div>

        <div className="bg-primary">
          <div className="mx-auto flex max-w-[1546px] items-center justify-center gap-3 px-6 py-6 sm:px-10 lg:px-16">
            {steps.map((step, index) => (
              <div key={step.label} className="flex items-center">
                <div className="flex flex-col items-center gap-1.5">
                  <span
                    className={`grid h-9 w-9 place-items-center rounded-full border-2 ${
                      index === 0
                        ? "border-secondary bg-secondary text-white"
                        : "border-secondary/40 bg-primary text-secondary/60"
                    }`}
                  >
                    <step.icon className="h-4 w-4" />
                  </span>
                  <span
                    className={`text-xs font-bold ${
                      index === 0 ? "text-secondary" : "text-secondary/60"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className="mx-2 mb-5 h-px w-10 border-t-2 border-dashed border-secondary/40 sm:w-16" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto max-w-[1546px] px-6 py-8 sm:px-10 lg:px-16">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-secondary">
            <span className="text-muted-foreground">Jump to</span>
            <a
              href="#outbound-leg"
              className="rounded-full border border-border px-3 py-1 hover:border-secondary"
            >
              {routeCode(fromLocation)} - {routeCode(toLocation)}
            </a>
            <a
              href="#return-leg"
              className="rounded-full border border-border px-3 py-1 hover:border-secondary"
            >
              {routeCode(toLocation)} - {routeCode(fromLocation)}
            </a>
          </div>

          <FlightLegSection
            id="outbound-leg"
            heading="Select your departing flight"
            fromLocation={fromLocation}
            toLocation={toLocation}
            date={outboundDate}
            onDateChange={setOutboundDate}
            state={outbound}
          />

          <FlightLegSection
            id="return-leg"
            heading="Select your returning flight"
            fromLocation={toLocation}
            toLocation={fromLocation}
            date={returnLegDate}
            onDateChange={setReturnLegDate}
            state={returnLeg}
          />

          <div className="mt-10 flex items-center justify-between gap-4 border-t border-border pt-8">
            <button
              type="button"
              onClick={handleEditSearch}
              className="rounded-full border border-secondary px-8 py-3 text-sm font-extrabold text-secondary transition hover:bg-secondary/10"
            >
              Back
            </button>
            <button
              type="button"
              disabled={!canContinue}
              className="rounded-full bg-secondary px-8 py-3 text-sm font-extrabold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-secondary/25"
            >
              Continue
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

type LegSearchState = ReturnType<typeof useFlightLegSearch>;

function useFlightLegSearch() {
  const [flights, setFlights] = useState<FlightSearchResult[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const latestSearchId = useRef(0);

  const run = async (params: {
    fromLocation: string;
    toLocation: string;
    departureDate: string;
    passengers: number;
  }) => {
    const searchId = latestSearchId.current + 1;
    latestSearchId.current = searchId;
    setIsSearching(true);
    setError(null);
    setFlights(null);
    setSelectedId(null);

    try {
      const results = await searchFlights(params);
      if (latestSearchId.current === searchId) {
        setFlights(results);
      }
    } catch (err) {
      if (latestSearchId.current === searchId) {
        setFlights(null);
        setError(err instanceof Error ? err.message : "Unable to search flights");
      }
    } finally {
      if (latestSearchId.current === searchId) {
        setIsSearching(false);
      }
    }
  };

  return { flights, isSearching, error, selectedId, setSelectedId, run };
}

function FlightLegSection({
  id,
  heading,
  fromLocation,
  toLocation,
  date,
  onDateChange,
  state,
}: {
  id: string;
  heading: string;
  fromLocation: string;
  toLocation: string;
  date: string;
  onDateChange: (date: string) => void;
  state: LegSearchState;
}) {
  const cheapestPrice =
    state.flights && state.flights.length > 0
      ? Math.min(...state.flights.map((flight) => Number(flight.price) || Infinity))
      : null;

  return (
    <section id={id} className="mt-10 scroll-mt-24">
      <p className="text-sm font-semibold text-muted-foreground">{heading}</p>
      <h3 className="mt-1 flex flex-wrap items-center gap-2 font-display text-2xl font-extrabold text-[#30343b] sm:text-3xl">
        {fromLocation} <Plane className="h-6 w-6 text-secondary" /> {toLocation}
      </h3>

      <DateCarousel date={date} onDateChange={onDateChange} cheapestPrice={cheapestPrice} />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold text-muted-foreground">Filter by</span>
          <StaticDropdown label="Time of flight" />
          <StaticDropdown label="Stops" />
          <StaticDropdown label="Price" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-muted-foreground">Sort by</span>
          <StaticDropdown label="Recommended" />
        </div>
      </div>

      <div className="mt-4">
        {state.isSearching && (
          <p className="rounded-lg border border-border bg-white px-6 py-10 text-center text-sm font-semibold text-muted-foreground">
            Searching flights...
          </p>
        )}

        {!state.isSearching && state.error && (
          <p className="rounded-lg border border-border bg-white px-6 py-10 text-center text-sm font-semibold text-accent">
            {state.error}
          </p>
        )}

        {!state.isSearching && !state.error && state.flights?.length === 0 && (
          <div className="rounded-lg border border-border bg-white px-6 py-10 text-center">
            <p className="text-sm font-bold text-[#30343b]">No flights found</p>
            <p className="mt-1 text-sm text-muted-foreground">Try a different date.</p>
          </div>
        )}

        {!state.isSearching && state.flights && state.flights.length > 0 && (
          <div className="grid gap-4">
            {state.flights.map((flight) => (
              <FlightCard
                key={flight.id}
                flight={flight}
                selected={state.selectedId === flight.id}
                onSelect={() => state.setSelectedId(flight.id)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function DateCarousel({
  date,
  onDateChange,
  cheapestPrice,
}: {
  date: string;
  onDateChange: (date: string) => void;
  cheapestPrice: number | null;
}) {
  const windowDates = getDateWindow(date, 7);
  const today = getTodayInputValue();

  const shiftWindow = (direction: -1 | 1) => {
    const shifted = addDaysToInputValue(date, direction * 7);
    onDateChange(shifted < today ? today : shifted);
  };

  return (
    <div className="mt-6 flex items-center gap-2 overflow-hidden rounded-lg border border-border bg-white">
      <button
        type="button"
        onClick={() => shiftWindow(-1)}
        aria-label="Earlier dates"
        className="grid h-full w-10 shrink-0 place-items-center self-stretch text-muted-foreground hover:text-secondary"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <div className="grid flex-1 grid-cols-7">
        {windowDates.map((dateValue) => {
          const isSelected = dateValue === date;
          const isPast = dateValue < today;

          return (
            <button
              key={dateValue}
              type="button"
              disabled={isPast}
              onClick={() => onDateChange(dateValue)}
              className={`flex flex-col items-center gap-1 border-l border-border px-2 py-3 text-center first:border-l-0 ${
                isSelected ? "bg-primary" : "bg-white hover:bg-muted/60"
              } ${isPast ? "cursor-not-allowed opacity-40" : ""}`}
            >
              <span className="text-xs font-semibold text-muted-foreground">
                {formatWeekdayShort(dateValue)}
              </span>
              <span className="text-xs font-bold text-[#30343b]">
                {isSelected && cheapestPrice !== null
                  ? formatPrice(String(cheapestPrice))
                  : isPast
                    ? "Not Available"
                    : "No Flights"}
              </span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => shiftWindow(1)}
        aria-label="Later dates"
        className="grid h-full w-10 shrink-0 place-items-center self-stretch text-muted-foreground hover:text-secondary"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function StaticDropdown({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="flex items-center gap-1.5 rounded-md border border-border bg-white px-3 py-2 text-xs font-semibold text-[#30343b]"
    >
      {label} <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
    </button>
  );
}

function FlightCard({
  flight,
  selected,
  onSelect,
}: {
  flight: FlightSearchResult;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`grid gap-4 rounded-lg border-2 bg-white px-5 py-5 text-left shadow-sm transition sm:grid-cols-[1fr_auto] sm:items-center ${
        selected ? "border-secondary" : "border-border hover:border-secondary/40"
      }`}
    >
      <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr_auto] sm:items-center">
        <div>
          <p className="text-lg font-extrabold text-[#30343b]">
            {formatTimeOnly(flight.departureDateTime)}
          </p>
          <p className="text-xs font-semibold text-muted-foreground">
            Depart - {flight.fromLocation}
          </p>
        </div>

        <ArrowRight className="hidden h-4 w-4 text-primary sm:block" />

        <div>
          <p className="text-lg font-extrabold text-[#30343b]">
            {formatTimeOnly(flight.arrivalDateTime)}
          </p>
          <p className="text-xs font-semibold text-muted-foreground">
            Arrive - {flight.toLocation}
          </p>
        </div>

        <div className="text-sm text-muted-foreground">
          <p className="font-semibold">
            {formatDuration(flight.departureDateTime, flight.arrivalDateTime)}
          </p>
          <p className="text-xs">{flight.airline?.name ?? "SunJet Partner"}</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-border pt-4 sm:flex-col sm:items-end sm:border-t-0 sm:pt-0">
        <p className="text-xs font-semibold text-muted-foreground">All-in Fare/guest</p>
        <p className="text-xl font-extrabold text-secondary">{formatPrice(flight.price)}</p>
      </div>
    </button>
  );
}

function parseString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function parsePositiveInt(value: unknown) {
  const numberValue = Number(value);
  return Number.isInteger(numberValue) && numberValue > 0 ? numberValue : undefined;
}

function parseNonNegativeInt(value: unknown) {
  const numberValue = Number(value);
  return Number.isInteger(numberValue) && numberValue >= 0 ? numberValue : undefined;
}

function routeCode(value: string) {
  const trimmed = value.trim();
  const lastWord = trimmed.split(/\s+/).pop() ?? trimmed;
  return lastWord.length === 3 ? lastWord.toUpperCase() : trimmed.slice(0, 3).toUpperCase();
}

function formatGuestsLabel(adults: number, children: number, infants: number) {
  const parts = [`${adults} ${adults === 1 ? "Adult" : "Adults"}`];

  if (children > 0) {
    parts.push(`${children} ${children === 1 ? "Child" : "Children"}`);
  }

  if (infants > 0) {
    parts.push(`${infants} ${infants === 1 ? "Infant" : "Infants"}`);
  }

  return parts.join(", ");
}

function formatShortDate(value: string) {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-PH", { day: "2-digit", month: "short", year: "numeric" });
}

function formatWeekdayShort(value: string) {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-PH", { weekday: "short", day: "2-digit", month: "short" });
}

function formatTimeOnly(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-PH", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Manila",
  });
}

function formatDuration(departure: string, arrival: string) {
  const start = new Date(departure).getTime();
  const end = new Date(arrival).getTime();

  if (Number.isNaN(start) || Number.isNaN(end) || end < start) {
    return "";
  }

  const totalMinutes = Math.round((end - start) / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${hours}h ${minutes}m`;
}

function formatPrice(value: string) {
  const price = Number(value);

  if (Number.isNaN(price)) {
    return value;
  }

  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(price);
}

function addDaysToInputValue(value: string, days: number) {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  date.setDate(date.getDate() + days);

  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function getDateWindow(centerDate: string, size: number) {
  const half = Math.floor((size - 1) / 2);
  return Array.from({ length: size }, (_, index) => addDaysToInputValue(centerDate, index - half));
}
