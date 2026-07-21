import { AlertCircle, ArrowLeftRight, ChevronDown, Plane, Search, X } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { CountField, SearchTextField } from "@/components/search/SearchFormFields";
import { DateRangeField } from "@/components/search/DateRangeField";
import { useFlightLocations } from "@/hooks/use-flight-locations";

const MAX_TRAVELERS = 3;

export function SearchFlightModal({
  open,
  onClose,
  initialFromLocation,
  initialToLocation,
  initialDepartureDate,
  initialReturnDate,
  initialTripType,
}: {
  open: boolean;
  onClose: (values: {
    fromLocation: string;
    toLocation: string;
    departureDate: string;
    returnDate: string;
    tripType: "roundtrip" | "oneway";
  }) => void;
  initialFromLocation: string;
  initialToLocation: string;
  initialDepartureDate: string;
  initialReturnDate: string;
  initialTripType: "roundtrip" | "oneway";
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
  const [tripType, setTripType] = useState<"roundtrip" | "oneway">(initialTripType);
  const [isTripTypeOpen, setIsTripTypeOpen] = useState(false);
  const tripTypeFieldRef = useRef<HTMLDivElement>(null);
  const totalTravelers = adults + children + infants;

  const updateAdults = (value: number) => {
    setAdults(Math.max(1, Math.min(value, MAX_TRAVELERS - children - infants)));
  };

  const updateChildren = (value: number) => {
    setChildren(Math.max(0, Math.min(value, MAX_TRAVELERS - adults - infants)));
  };

  const updateInfants = (value: number) => {
    setInfants(Math.max(0, Math.min(value, MAX_TRAVELERS - adults - children)));
  };

  useEffect(() => {
    if (open) {
      setFromLocation(initialFromLocation);
      setToLocation(initialToLocation);
      setDepartureDate(initialDepartureDate);
      setReturnDate(initialReturnDate);
      setTripType(initialTripType);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tripTypeFieldRef.current && !tripTypeFieldRef.current.contains(event.target as Node)) {
        setIsTripTypeOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!open) {
    return null;
  }

  const handleClose = () => {
    onClose({ fromLocation, toLocation, departureDate, returnDate, tripType });
  };

  const handleSwapLocations = () => {
    setFromLocation(toLocation);
    setToLocation(fromLocation);
  };

  const isFormComplete = Boolean(
    fromLocation.trim() &&
    toLocation.trim() &&
    departureDate &&
    (tripType === "oneway" || returnDate) &&
    totalTravelers <= MAX_TRAVELERS,
  );

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const trimmedFromLocation = fromLocation.trim();
    const trimmedToLocation = toLocation.trim();

    if (
      !trimmedFromLocation ||
      !trimmedToLocation ||
      !departureDate ||
      (tripType === "roundtrip" && !returnDate)
    ) {
      setError(
        tripType === "roundtrip"
          ? "Enter an origin, destination, depart date, and return date"
          : "Enter an origin, destination, and depart date",
      );
      return;
    }

    if (trimmedFromLocation.toLowerCase() === trimmedToLocation.toLowerCase()) {
      setError("Origin and destination must be different");
      return;
    }

    if (totalTravelers > MAX_TRAVELERS) {
      setError(`A booking can include up to ${MAX_TRAVELERS} travelers.`);
      return;
    }

    await navigate({
      to: "/search-flight",
      search: {
        fromLocation: trimmedFromLocation,
        toLocation: trimmedToLocation,
        departureDate,
        returnDate: tripType === "roundtrip" ? returnDate : undefined,
        tripType,
        adults,
        children,
        infants,
        passengers: totalTravelers,
        promoCode: promoCode.trim() || undefined,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 h-dvh w-screen overflow-y-auto bg-white">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-4 bg-linear-to-r from-secondary to-[#0a4fa8] px-6 py-5 shadow-md sm:px-10 lg:px-16">
        <h1 className="flex items-center gap-2 font-display text-xl font-extrabold text-white sm:text-2xl">
          <Plane className="h-5 w-5 -rotate-45 text-primary" />
          Search Flight
        </h1>
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close"
          className="grid h-10 w-10 place-items-center rounded-full text-white transition hover:bg-white/15"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="mx-auto max-w-[1350px] px-6 py-10 sm:px-10 sm:py-16 lg:px-16 lg:py-24">
        <h2 className="font-display text-3xl font-extrabold text-[#30343b] sm:text-5xl">
          Hi, where would you like to go?
        </h2>

        <form onSubmit={handleSubmit} className="mt-16">
          <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[1fr_1px_1fr] lg:items-center lg:gap-6">
            <div className="flex items-center gap-3">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-secondary">
                <Plane className="h-4 w-4 -rotate-45" />
              </span>
              <span className="text-lg font-extrabold text-[#30343b]">Flight</span>
            </div>

            <div className="hidden h-10 bg-border lg:block" />

            <div ref={tripTypeFieldRef} className="relative w-fit">
              <button
                type="button"
                onClick={() => setIsTripTypeOpen((prev) => !prev)}
                className="flex w-fit items-center gap-2 text-lg font-extrabold text-[#30343b]"
              >
                {tripType === "roundtrip" ? "Round-trip" : "One-way"}{" "}
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>

              {isTripTypeOpen && (
                <ul className="absolute left-0 top-full z-20 mt-2 w-44 overflow-hidden rounded-lg border border-border bg-white py-1 shadow-lg">
                  {(["roundtrip", "oneway"] as const).map((type) => {
                    const isSelected = tripType === type;

                    return (
                      <li key={type}>
                        <button
                          type="button"
                          onClick={() => {
                            setTripType(type);
                            setIsTripTypeOpen(false);
                            if (type === "oneway") {
                              setReturnDate("");
                            }
                          }}
                          className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-base font-medium transition hover:bg-muted ${
                            isSelected ? "text-secondary" : "text-[#30343b]"
                          }`}
                        >
                          {type === "roundtrip" ? "Round-trip" : "One-way"}
                          {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-secondary" />}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          <div
            className={`mt-8 flex flex-col divide-y divide-border  border border-border bg-white shadow-sm sm:grid sm:grid-cols-2 sm:divide-x sm:divide-y-0 ${
              tripType === "roundtrip" ? "lg:grid-cols-4" : "lg:grid-cols-3"
            }`}
          >
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
                className="absolute left-1/2 top-0 z-10 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-secondary bg-white text-secondary shadow-sm transition hover:bg-primary sm:left-0 sm:top-1/2 sm:-translate-y-1/2"
              >
                <ArrowLeftRight className="h-4 w-4 rotate-90 sm:rotate-0" />
              </button>
            </div>

            <DateRangeField
              variant="modal"
              tripType={tripType}
              departureDate={departureDate}
              returnDate={returnDate}
              onChangeDeparture={setDepartureDate}
              onChangeReturn={setReturnDate}
            />
          </div>

          <div className="mt-8 flex flex-col gap-6 lg:grid lg:grid-cols-[2fr_1fr]">
            <div className="flex flex-col gap-6 sm:grid sm:grid-cols-3">
              <CountField
                label="Adults"
                helper="12+ years · total limit: 3 travelers"
                value={adults}
                min={1}
                onChange={updateAdults}
              />
              <CountField
                label="Children"
                helper="2 - 11 years"
                value={children}
                min={0}
                onChange={updateChildren}
              />
              <CountField
                label="Infant"
                helper="under 2 years"
                value={infants}
                min={0}
                onChange={updateInfants}
              />
            </div>

            <label className="block">
              <span className="text-lg font-medium text-muted-foreground">Enter promo code</span>
              <input
                value={promoCode}
                onChange={(event) => setPromoCode(event.target.value)}
                placeholder="Promo Code (Optional)"
                className="mt-2 h-[72px] w-full  border border-border px-5 text-xl font-medium text-[#30343b] outline-none transition placeholder:text-muted-foreground/50 focus:border-secondary"
              />
            </label>
          </div>

          {error && (
            <div className="mt-6 flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/5 px-4 py-3">
              <AlertCircle className="h-4 w-4 shrink-0 text-accent" />
              <p className="text-sm font-semibold text-accent">{error}</p>
            </div>
          )}

          <div className="mt-10 flex justify-end">
            <button
              type="submit"
              disabled={!isFormComplete}
              className="flex h-[72px] w-full items-center justify-center gap-2 bg-secondary px-8 text-xl font-extrabold text-white shadow-md transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-secondary/25 disabled:shadow-none sm:w-[340px]"
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
