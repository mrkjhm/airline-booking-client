import { ArrowLeftRight, ChevronDown, Plane, Search, X } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import {
  CountField,
  DateField,
  SearchTextField,
  getTodayInputValue,
} from "@/components/search/SearchFormFields";
import { useFlightLocations } from "@/hooks/use-flight-locations";

export function SearchFlightModal({
  open,
  onClose,
  initialFromLocation,
  initialToLocation,
  initialDepartureDate,
  initialReturnDate,
}: {
  open: boolean;
  onClose: (values: {
    fromLocation: string;
    toLocation: string;
    departureDate: string;
    returnDate: string;
  }) => void;
  initialFromLocation: string;
  initialToLocation: string;
  initialDepartureDate: string;
  initialReturnDate: string;
}) {
  const navigate = useNavigate();
  const locations = useFlightLocations();
  const [fromLocation, setFromLocation] = useState(initialFromLocation);
  const [toLocation, setToLocation] = useState(initialToLocation);
  const [departureDate, setDepartureDate] = useState(initialDepartureDate);
  const [returnDate, setReturnDate] = useState(initialReturnDate);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [promoCode, setPromoCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setFromLocation(initialFromLocation);
      setToLocation(initialToLocation);
      setDepartureDate(initialDepartureDate);
      setReturnDate(initialReturnDate);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) {
    return null;
  }

  const handleClose = () => {
    onClose({ fromLocation, toLocation, departureDate, returnDate });
  };

  const handleSwapLocations = () => {
    setFromLocation(toLocation);
    setToLocation(fromLocation);
  };

  const isFormComplete = Boolean(
    fromLocation.trim() && toLocation.trim() && departureDate && returnDate,
  );

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const trimmedFromLocation = fromLocation.trim();
    const trimmedToLocation = toLocation.trim();

    if (!trimmedFromLocation || !trimmedToLocation || !departureDate || !returnDate) {
      setError("Enter an origin, destination, depart date, and return date");
      return;
    }

    if (trimmedFromLocation.toLowerCase() === trimmedToLocation.toLowerCase()) {
      setError("Origin and destination must be different");
      return;
    }

    await navigate({
      to: "/search-flight",
      search: {
        fromLocation: trimmedFromLocation,
        toLocation: trimmedToLocation,
        departureDate,
        returnDate,
        adults,
        children,
        infants,
        passengers: Math.max(1, adults + children),
        promoCode: promoCode.trim() || undefined,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 h-dvh w-screen overflow-y-auto bg-white">
      <div className="mx-auto max-w-[1546px] px-6 py-10 sm:px-10 sm:py-16 lg:px-16 lg:py-24">
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close"
          className="absolute right-6 top-6 grid h-10 w-10 place-items-center rounded-full text-secondary transition hover:bg-muted sm:right-10 lg:right-16"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="font-display text-3xl font-extrabold text-[#30343b] sm:text-5xl">
          Hi, where would you like to go?
        </h2>

        <form onSubmit={handleSubmit} className="mt-16">
          <div className="grid gap-6 lg:grid-cols-[1fr_1px_1fr] lg:items-center">
            <div className="flex items-center gap-3">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-secondary">
                <Plane className="h-4 w-4 -rotate-45" />
              </span>
              <span className="text-lg font-extrabold text-[#30343b]">Flight</span>
            </div>

            <div className="hidden h-10 bg-border lg:block" />

            <button
              type="button"
              className="flex w-fit items-center gap-2 text-lg font-extrabold text-[#30343b]"
            >
              Round-trip <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <SearchTextField
              label="From"
              value={fromLocation}
              onChange={setFromLocation}
              onClear={() => {
                setFromLocation("");
                setToLocation("");
              }}
              placeholder="Origin city"
              options={locations}
              excludeValue={toLocation}
            />
            <div className="relative">
              <SearchTextField
                label="To"
                value={toLocation}
                onChange={setToLocation}
                placeholder="Destination city"
                options={locations}
                excludeValue={fromLocation}
              />
              <button
                type="button"
                onClick={handleSwapLocations}
                aria-label="Swap origin and destination"
                className="absolute left-0 top-[38px] z-10 grid h-9 w-9 -translate-x-1/2 place-items-center rounded-full border border-secondary bg-white text-secondary shadow-sm transition hover:bg-primary sm:left-0"
              >
                <ArrowLeftRight className="h-4 w-4" />
              </button>
            </div>

            <DateField
              label="Depart"
              value={departureDate}
              onChange={setDepartureDate}
              min={getTodayInputValue()}
            />
            <DateField
              label="Return"
              value={returnDate}
              onChange={setReturnDate}
              min={departureDate || getTodayInputValue()}
              placeholder="Returning on"
            />
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div className="grid gap-6 sm:grid-cols-3">
              <CountField
                label="Adults"
                helper="12+ years"
                value={adults}
                min={1}
                onChange={setAdults}
              />
              <CountField
                label="Children"
                helper="2 - 11 years"
                value={children}
                min={0}
                onChange={setChildren}
              />
              <CountField
                label="Infant"
                helper="under 2 years"
                value={infants}
                min={0}
                onChange={setInfants}
              />
            </div>

            <label className="block">
              <span className="text-lg font-medium text-muted-foreground">Enter promo code</span>
              <input
                value={promoCode}
                onChange={(event) => setPromoCode(event.target.value)}
                placeholder="Promo Code (Optional)"
                className="mt-2 h-[72px] w-full rounded-md border border-border px-5 text-xl font-medium text-[#30343b] outline-none transition placeholder:text-muted-foreground/50 focus:border-secondary"
              />
            </label>
          </div>

          {error && <p className="mt-6 text-sm font-semibold text-accent">{error}</p>}

          <div className="mt-10 flex justify-end">
            <button
              type="submit"
              disabled={!isFormComplete}
              className="flex h-[72px] w-full items-center justify-center gap-2 rounded-xl bg-secondary px-8 text-xl font-extrabold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-secondary/25 sm:w-[340px]"
            >
              <Search className="h-5 w-5" />
              Search flights
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
