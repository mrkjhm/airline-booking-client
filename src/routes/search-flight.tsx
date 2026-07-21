import { createFileRoute } from "@tanstack/react-router";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Loader2,
  Luggage,
  Plane,
  SearchX,
  UserRound,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  searchFlights,
  searchRoundTripFlights,
  type FlightSearchResult,
} from "@/lib/search-flight";
import {
  createHostedInvoice,
  createOrder,
  createPassenger,
  createPayment,
  type Booking,
  type PassengerCategory,
  type Payment,
  type PaymentMethod,
} from "@/lib/booking-api";
import { getTodayInputValue } from "@/components/search/SearchFormFields";
import { Header } from "@/components/home/Header";

type SearchFlightRouteSearch = {
  fromLocation?: string;
  toLocation?: string;
  tripType?: "roundtrip" | "oneway";
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
    tripType: parseTripType(search.tripType),
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

type CheckoutStep = "flights" | "passengers" | "payment" | "confirmation";

const stepIndexes: Record<CheckoutStep, number> = {
  flights: 0,
  passengers: 1,
  payment: 3,
  confirmation: 4,
};

const paymentMethods: Array<{ value: PaymentMethod; label: string; note: string }> = [
  { value: "CARD", label: "Card", note: "Mock card authorization" },
  { value: "GCASH", label: "GCash", note: "Create a pending wallet payment" },
  { value: "BANK_TRANSFER", label: "Bank transfer", note: "Manual confirmation required" },
  { value: "CASH", label: "Cash", note: "Pay at counter or branch" },
];

type PassengerForm = {
  firstName: string;
  lastName: string;
  email: string;
  mobileNumber: string;
  dateOfBirth: string;
  passportNumber: string;
  baggageDetails: string;
  passengerCategory: PassengerCategory;
};

const createEmptyPassenger = (passengerCategory: PassengerCategory): PassengerForm => ({
  firstName: "",
  lastName: "",
  email: "",
  mobileNumber: "",
  dateOfBirth: "",
  passportNumber: "",
  baggageDetails: "",
  passengerCategory,
});

function SearchFlightPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const fromLocation = search.fromLocation ?? "";
  const toLocation = search.toLocation ?? "";
  const isRoundTrip = search.tripType !== "oneway";
  const adults = Math.max(1, search.adults ?? search.passengers ?? 1);
  const children = search.children ?? 0;
  const infants = search.infants ?? 0;
  const passengerCount = Math.max(1, adults + children);

  const [outboundDate, setOutboundDate] = useState(search.departureDate ?? "");
  const [returnLegDate, setReturnLegDate] = useState(search.returnDate ?? "");

  const outbound = useFlightLegSearch();
  const returnLeg = useFlightLegSearch();
  const [currentStep, setCurrentStep] = useState<CheckoutStep>("flights");
  const [passengerForms, setPassengerForms] = useState<PassengerForm[]>(() =>
    buildPassengerForms(adults, children, infants),
  );
  const [passengerError, setPassengerError] = useState<string | null>(null);
  const [isSavingPassengers, setIsSavingPassengers] = useState(false);
  const [createdBookings, setCreatedBookings] = useState<Booking[]>([]);
  const [createdOrderId, setCreatedOrderId] = useState<number | null>(null);
  const [createdPayments, setCreatedPayments] = useState<Payment[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CARD");
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);

  useEffect(() => {
    setOutboundDate(search.departureDate ?? "");
    setReturnLegDate(search.returnDate ?? "");
  }, [search.departureDate, search.returnDate]);

  useEffect(() => {
    setPassengerForms(buildPassengerForms(adults, children, infants));
    setCurrentStep("flights");
    setPassengerError(null);
    setPaymentError(null);
    setCreatedBookings([]);
    setCreatedPayments([]);
  }, [adults, children, infants, outbound.selectedId, returnLeg.selectedId]);

  useEffect(() => {
    if (!fromLocation || !toLocation || !outboundDate) return;

    if (isRoundTrip && !returnLegDate) return;

    if (isRoundTrip) {
      const outboundSearchId = outbound.start();
      const returnSearchId = returnLeg.start();

      void searchRoundTripFlights({
        fromLocation,
        toLocation,
        departureDate: outboundDate,
        returnDate: returnLegDate,
        passengers: passengerCount,
      })
        .then((results) => {
          outbound.resolve(outboundSearchId, results.outboundFlights);
          returnLeg.resolve(returnSearchId, results.returnFlights);
        })
        .catch((err) => {
          const message = err instanceof Error ? err.message : "Unable to search flights";
          outbound.reject(outboundSearchId, message);
          returnLeg.reject(returnSearchId, message);
        });
    } else {
      void outbound.run({
        fromLocation,
        toLocation,
        departureDate: outboundDate,
        passengers: passengerCount,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromLocation, toLocation, isRoundTrip, outboundDate, returnLegDate, passengerCount]);

  const handleEditSearch = () => {
    void navigate({ to: "/" });
  };

  const canContinue = Boolean(outbound.selectedId && (!isRoundTrip || returnLeg.selectedId));
  const selectedOutboundFlight = outbound.flights?.find(
    (flight) => flight.id === outbound.selectedId,
  );
  const selectedReturnFlight = returnLeg.flights?.find(
    (flight) => flight.id === returnLeg.selectedId,
  );

  const handlePassengerChange = (index: number, field: keyof PassengerForm, value: string) => {
    setPassengerForms((current) =>
      current.map((passenger, passengerIndex) =>
        passengerIndex === index ? { ...passenger, [field]: value } : passenger,
      ),
    );
    setPassengerError(null);
  };

  const handleSavePassengers = async () => {
    if (!selectedOutboundFlight || (isRoundTrip && !selectedReturnFlight)) {
      setPassengerError(
        isRoundTrip
          ? "Select departing and returning flights first"
          : "Select a departing flight first",
      );
      setCurrentStep("flights");
      return;
    }

    const invalidPassenger = passengerForms.find(
      (passenger) => !passenger.firstName.trim() || !passenger.lastName.trim(),
    );

    if (invalidPassenger) {
      setPassengerError("Each passenger needs a first name and last name");
      return;
    }

    setIsSavingPassengers(true);
    setPassengerError(null);

    try {
      const order = await createOrder({
        flights: [
          {
            flightId: selectedOutboundFlight.id,
            flightType: isRoundTrip ? "ROUND_TRIP" : "ONE_WAY",
          },
          ...(isRoundTrip && selectedReturnFlight
            ? [{ flightId: selectedReturnFlight.id, flightType: "ROUND_TRIP" as const }]
            : []),
        ],
        passengers: passengerForms.length,
      });
      const bookings = order.bookings;

      for (const booking of bookings) {
        await Promise.all(
          passengerForms.map((passenger) =>
            createPassenger({
              bookingId: booking.id,
              firstName: passenger.firstName.trim(),
              lastName: passenger.lastName.trim(),
              email: passenger.email.trim() || undefined,
              mobileNumber: passenger.mobileNumber.trim() || undefined,
              passengerCategory: passenger.passengerCategory,
              baggageDetails: passenger.baggageDetails.trim() || undefined,
              otherDetails: JSON.stringify({
                dateOfBirth: passenger.dateOfBirth || undefined,
                passportNumber: passenger.passportNumber.trim() || undefined,
                outboundFlightId: selectedOutboundFlight.id,
                returnFlightId: selectedReturnFlight?.id,
              }),
            }),
          ),
        );
      }

      setCreatedBookings(bookings);
      setCreatedOrderId(order.id);
      setCreatedPayments([]);
      setCurrentStep("payment");
    } catch (err) {
      setPassengerError(err instanceof Error ? err.message : "Unable to save passenger details");
    } finally {
      setIsSavingPassengers(false);
    }
  };

  const handleCreatePayments = async () => {
    if (createdBookings.length === 0 || !createdOrderId) {
      setPaymentError("Save passenger details before creating a payment");
      setCurrentStep("passengers");
      return;
    }

    setIsCreatingPayment(true);
    setPaymentError(null);

    try {
      if (["CARD", "GCASH", "BANK_TRANSFER"].includes(paymentMethod)) {
        const { invoiceUrl } = await createHostedInvoice(createdOrderId, paymentMethod);
        window.location.href = invoiceUrl; // redirect to Xendit's hosted checkout
        return; // confirmation happens after redirect back + webhook
      }

      const payment = await createPayment({
        orderId: createdOrderId,
        paymentMethod,
      });

      setCreatedPayments([payment]);
      setCurrentStep("confirmation");
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : "Unable to create payment");
    } finally {
      setIsCreatingPayment(false);
    }
  };

  if (!fromLocation || !toLocation || !outboundDate || (isRoundTrip && !returnLegDate)) {
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
              {isRoundTrip && (
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
              )}
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
            {steps.map((step, index) => {
              const activeStepIndex = stepIndexes[currentStep];
              const isActive = index === activeStepIndex;
              const isComplete = index < activeStepIndex;

              return (
                <div key={step.label} className="flex items-center">
                  <div className="flex flex-col items-center gap-1.5">
                    <span
                      className={`grid h-9 w-9 place-items-center rounded-full border-2 ${
                        isActive
                          ? "border-secondary bg-secondary text-white"
                          : isComplete
                            ? "border-secondary bg-white text-secondary"
                            : "border-secondary/40 bg-primary text-secondary/60"
                      }`}
                    >
                      <step.icon className="h-4 w-4" />
                    </span>
                    <span
                      className={`text-xs font-bold ${
                        isActive || isComplete ? "text-secondary" : "text-secondary/60"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="mx-2 mb-5 h-px w-10 border-t-2 border-dashed border-secondary/40 sm:w-16" />
                  )}
                </div>
              );
            })}
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
            {isRoundTrip && (
              <a
                href="#return-leg"
                className="rounded-full border border-border px-3 py-1 hover:border-secondary"
              >
                {routeCode(toLocation)} - {routeCode(fromLocation)}
              </a>
            )}
          </div>

          {currentStep === "flights" && (
            <>
              <FlightLegSection
                id="outbound-leg"
                heading="Select your departing flight"
                fromLocation={fromLocation}
                toLocation={toLocation}
                date={outboundDate}
                onDateChange={setOutboundDate}
                state={outbound}
              />

              {isRoundTrip && (
                <FlightLegSection
                  id="return-leg"
                  heading="Select your returning flight"
                  fromLocation={toLocation}
                  toLocation={fromLocation}
                  date={returnLegDate}
                  onDateChange={setReturnLegDate}
                  state={returnLeg}
                />
              )}

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
                  onClick={() => setCurrentStep("passengers")}
                  className="rounded-full bg-secondary px-8 py-3 text-sm font-extrabold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-secondary/25"
                >
                  Continue
                </button>
              </div>
            </>
          )}

          {currentStep === "passengers" && (
            <PassengerDetailsStep
              passengers={passengerForms}
              outboundFlight={selectedOutboundFlight}
              returnFlight={selectedReturnFlight}
              error={passengerError}
              isSaving={isSavingPassengers}
              onBack={() => setCurrentStep("flights")}
              onChange={handlePassengerChange}
              onSubmit={handleSavePassengers}
            />
          )}

          {currentStep === "payment" && (
            <PaymentStep
              bookings={createdBookings}
              method={paymentMethod}
              error={paymentError}
              isCreating={isCreatingPayment}
              onMethodChange={setPaymentMethod}
              onBack={() => setCurrentStep("passengers")}
              onSubmit={handleCreatePayments}
            />
          )}

          {currentStep === "confirmation" && (
            <ConfirmationStep
              bookings={createdBookings}
              payments={createdPayments}
              onViewBookings={() => void navigate({ to: "/my-bookings" })}
              onSearchAgain={handleEditSearch}
            />
          )}
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

  const start = () => {
    const searchId = latestSearchId.current + 1;
    latestSearchId.current = searchId;
    setIsSearching(true);
    setError(null);
    setFlights(null);
    setSelectedId(null);

    return searchId;
  };

  const resolve = (searchId: number, results: FlightSearchResult[]) => {
    if (latestSearchId.current === searchId) {
      setFlights(results);
      setIsSearching(false);
    }
  };

  const reject = (searchId: number, message: string) => {
    if (latestSearchId.current === searchId) {
      setFlights(null);
      setError(message);
      setIsSearching(false);
    }
  };

  return { flights, isSearching, error, selectedId, setSelectedId, run, start, resolve, reject };
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
          <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-white px-6 py-14 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-secondary" />
            <p className="text-sm font-semibold text-muted-foreground">Searching flights...</p>
          </div>
        )}

        {!state.isSearching && state.error && (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-accent/30 bg-accent/5 px-6 py-10 text-center">
            <AlertCircle className="h-6 w-6 text-accent" />
            <p className="text-sm font-bold text-accent">Something went wrong</p>
            <p className="text-sm text-muted-foreground">{state.error}</p>
          </div>
        )}

        {!state.isSearching && !state.error && state.flights?.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-border bg-white px-6 py-14 text-center">
            <SearchX className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm font-bold text-[#30343b]">No flights found</p>
            <p className="text-sm text-muted-foreground">Try a different date.</p>
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
  const scrollerRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  const shiftWindow = (direction: -1 | 1) => {
    const shifted = addDaysToInputValue(date, direction * 7);
    onDateChange(shifted < today ? today : shifted);
  };

  useEffect(() => {
    selectedRef.current?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [date]);

  return (
    <div className="mt-6 flex items-stretch gap-1 rounded-lg border border-border bg-white p-1">
      <button
        type="button"
        onClick={() => shiftWindow(-1)}
        aria-label="Earlier dates"
        className="flex w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted/60 hover:text-secondary"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <div
        ref={scrollerRef}
        className="scrollbar-none flex min-w-0 flex-1 gap-1 overflow-x-auto [-ms-overflow-style:none]"
      >
        {windowDates.map((dateValue) => {
          const isSelected = dateValue === date;
          const isPast = dateValue < today;

          return (
            <button
              key={dateValue}
              ref={isSelected ? selectedRef : undefined}
              type="button"
              disabled={isPast}
              onClick={() => onDateChange(dateValue)}
              className={`flex min-w-19 flex-1 flex-col items-center gap-1 rounded-md px-2 py-3 text-center transition ${
                isSelected ? "bg-primary" : "bg-white hover:bg-muted/60"
              } ${isPast ? "cursor-not-allowed opacity-40" : ""}`}
            >
              <span className="whitespace-nowrap text-[11px] font-semibold text-muted-foreground">
                {formatWeekdayShort(dateValue)}
              </span>
              <span className="whitespace-nowrap text-[11px] font-bold text-[#30343b]">
                {isSelected && cheapestPrice !== null
                  ? formatPrice(String(cheapestPrice))
                  : isPast
                    ? "Not available"
                    : "No flights"}
              </span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => shiftWindow(1)}
        aria-label="Later dates"
        className="flex w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted/60 hover:text-secondary"
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
  const lowSeats = flight.seatsAvailable > 0 && flight.seatsAvailable <= 5;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`grid gap-4 rounded-lg border-2 bg-white px-5 py-5 text-left shadow-sm transition sm:grid-cols-[1fr_auto] sm:items-center ${
        selected
          ? "border-secondary ring-2 ring-secondary/20"
          : "border-border hover:border-secondary/40"
      }`}
    >
      <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr_auto] sm:items-center">
        <div className="flex items-center justify-between gap-3 sm:contents">
          <div>
            <p className="text-lg font-extrabold text-[#30343b]">
              {formatTimeOnly(flight.departureDateTime)}
            </p>
            <p className="text-xs font-semibold text-muted-foreground">
              Depart · {flight.fromLocation}
            </p>
          </div>

          <ArrowRight className="h-4 w-4 shrink-0 text-primary" />

          <div className="text-right sm:text-left">
            <p className="text-lg font-extrabold text-[#30343b]">
              {formatTimeOnly(flight.arrivalDateTime)}
            </p>
            <p className="text-xs font-semibold text-muted-foreground">
              Arrive · {flight.toLocation}
            </p>
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          <p className="font-semibold text-[#30343b]">
            {formatDuration(flight.departureDateTime, flight.arrivalDateTime)}{" "}
            <span className="font-medium text-muted-foreground">· Non-stop</span>
          </p>
          <p className="text-xs">{flight.airline?.name ?? "SunJet Partner"}</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-border pt-4 sm:flex-col sm:items-end sm:border-t-0 sm:pt-0">
        <div className="sm:text-right">
          <p className="text-xs font-semibold text-muted-foreground">All-in Fare/guest</p>
          {lowSeats && (
            <p className="mt-0.5 flex items-center gap-1 text-xs font-bold text-amber-600 sm:justify-end">
              <AlertTriangle className="h-3 w-3" />
              Only {flight.seatsAvailable} seat{flight.seatsAvailable === 1 ? "" : "s"} left
            </p>
          )}
        </div>
        <p className="text-xl font-extrabold text-secondary">{formatPrice(flight.price)}</p>
        {selected && (
          <span className="flex items-center gap-1 text-xs font-extrabold text-secondary sm:mt-1">
            <Check className="h-3.5 w-3.5" /> Selected
          </span>
        )}
      </div>
    </button>
  );
}

function PassengerDetailsStep({
  passengers,
  outboundFlight,
  returnFlight,
  error,
  isSaving,
  onBack,
  onChange,
  onSubmit,
}: {
  passengers: PassengerForm[];
  outboundFlight?: FlightSearchResult;
  returnFlight?: FlightSearchResult;
  error: string | null;
  isSaving: boolean;
  onBack: () => void;
  onChange: (index: number, field: keyof PassengerForm, value: string) => void;
  onSubmit: () => void;
}) {
  const passengerCount = passengers.length;
  const totalFare = [outboundFlight, returnFlight]
    .filter((flight): flight is FlightSearchResult => Boolean(flight))
    .reduce((total, flight) => total + Number(flight.price) * passengerCount, 0);

  return (
    <section className="mt-10">
      <div className="rounded-xl border border-border bg-white px-5 py-5">
        <p className="text-sm font-semibold text-muted-foreground">Guest Details</p>
        <h2 className="mt-1 font-display text-2xl font-extrabold text-[#30343b]">
          Passenger information
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Add the traveler names and contact details required before issuing tickets.{" "}
          <span className="font-semibold text-[#30343b]">Fields marked * are required.</span>
        </p>

        {(outboundFlight || returnFlight) && (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {outboundFlight && (
              <SelectedFlightSummary
                label="Departing"
                flight={outboundFlight}
                passengerCount={passengerCount}
              />
            )}
            {returnFlight && (
              <SelectedFlightSummary
                label="Returning"
                flight={returnFlight}
                passengerCount={passengerCount}
              />
            )}
          </div>
        )}

        {(outboundFlight || returnFlight) && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-secondary px-4 py-3 text-white">
            <p className="text-sm font-semibold">
              {passengerCount} passenger{passengerCount === 1 ? "" : "s"} · Total booking fare
            </p>
            <p className="text-lg font-extrabold">{formatPrice(String(totalFare))}</p>
          </div>
        )}
      </div>

      <div className="mt-5 grid gap-5">
        {passengers.map((passenger, index) => (
          <div key={index} className="rounded-xl border border-border bg-white px-5 py-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-extrabold text-[#30343b]">Passenger {index + 1}</p>
                <p className="text-xs font-semibold text-muted-foreground">
                  {formatPassengerCategory(passenger.passengerCategory)}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <PassengerInput
                label="First name"
                value={passenger.firstName}
                onChange={(value) => onChange(index, "firstName", value)}
                required
              />
              <PassengerInput
                label="Last name"
                value={passenger.lastName}
                onChange={(value) => onChange(index, "lastName", value)}
                required
              />
              <PassengerInput
                label="Email"
                type="email"
                value={passenger.email}
                onChange={(value) => onChange(index, "email", value)}
              />
              <PassengerInput
                label="Mobile number"
                type="tel"
                value={passenger.mobileNumber}
                onChange={(value) => onChange(index, "mobileNumber", value)}
                placeholder="Optional, 11+ digits"
              />
              <PassengerInput
                label="Date of birth"
                type="date"
                value={passenger.dateOfBirth}
                onChange={(value) => onChange(index, "dateOfBirth", value)}
              />
              <PassengerInput
                label="Passport / document no."
                value={passenger.passportNumber}
                onChange={(value) => onChange(index, "passportNumber", value)}
                placeholder="Optional"
              />
            </div>

            <label className="mt-4 block">
              <span className="text-sm font-bold text-muted-foreground">Baggage details</span>
              <textarea
                value={passenger.baggageDetails}
                onChange={(event) => onChange(index, "baggageDetails", event.target.value)}
                placeholder="Optional baggage notes"
                className="mt-2 min-h-24 w-full rounded-lg border border-border px-4 py-3 text-sm font-medium text-[#30343b] outline-none transition placeholder:text-muted-foreground/50 focus:border-secondary"
              />
            </label>
          </div>
        ))}
      </div>

      {error && (
        <div className="mt-5 flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/5 px-4 py-3">
          <AlertCircle className="h-4 w-4 shrink-0 text-accent" />
          <p className="text-sm font-semibold text-accent">{error}</p>
        </div>
      )}

      <div className="mt-10 flex items-center justify-between gap-4 border-t border-border pt-8">
        <button
          type="button"
          onClick={onBack}
          disabled={isSaving}
          className="rounded-full border border-secondary px-8 py-3 text-sm font-extrabold text-secondary transition hover:bg-secondary/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSaving}
          className="rounded-full bg-secondary px-8 py-3 text-sm font-extrabold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-secondary/25"
        >
          {isSaving ? "Saving..." : "Save and continue to payment"}
        </button>
      </div>
    </section>
  );
}

function PaymentStep({
  bookings,
  method,
  error,
  isCreating,
  onMethodChange,
  onBack,
  onSubmit,
}: {
  bookings: Booking[];
  method: PaymentMethod;
  error: string | null;
  isCreating: boolean;
  onMethodChange: (method: PaymentMethod) => void;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const totalAmount = bookings.reduce((sum, booking) => sum + Number(booking.totalAmount), 0);

  return (
    <section className="mt-10">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="rounded-xl border border-border bg-white px-5 py-5">
          <p className="text-sm font-semibold text-muted-foreground">Payment</p>
          <h2 className="mt-1 font-display text-2xl font-extrabold text-[#30343b]">
            Choose a payment method
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This creates a pending payment record for each booking. Admin or payment processing can
            later mark it as paid, failed, or cancelled.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {paymentMethods.map((paymentOption) => {
              const selected = paymentOption.value === method;

              return (
                <button
                  key={paymentOption.value}
                  type="button"
                  onClick={() => onMethodChange(paymentOption.value)}
                  className={`rounded-lg border-2 px-4 py-4 text-left transition ${
                    selected
                      ? "border-secondary bg-secondary/5"
                      : "border-border hover:border-secondary/40"
                  }`}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="text-sm font-extrabold text-[#30343b]">
                      {paymentOption.label}
                    </span>
                    <span
                      className={`grid h-5 w-5 place-items-center rounded-full border ${
                        selected ? "border-secondary bg-secondary text-white" : "border-border"
                      }`}
                    >
                      {selected && <Check className="h-3 w-3" />}
                    </span>
                  </span>
                  <span className="mt-1 block text-xs font-semibold text-muted-foreground">
                    {paymentOption.note}
                  </span>
                </button>
              );
            })}
          </div>

          {error && (
            <div className="mt-5 flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/5 px-4 py-3">
              <AlertCircle className="h-4 w-4 shrink-0 text-accent" />
              <p className="text-sm font-semibold text-accent">{error}</p>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-white px-5 py-5">
          <p className="text-sm font-extrabold text-[#30343b]">Booking summary</p>
          <div className="mt-4 grid gap-3">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="rounded-lg border border-border bg-muted/30 px-4 py-3"
              >
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Booking #{booking.id}
                </p>
                <p className="mt-1 text-sm font-extrabold text-[#30343b]">
                  {formatPrice(String(booking.totalAmount))}
                </p>
                <p className="mt-0.5 text-xs font-semibold text-muted-foreground">
                  {booking.passengers ?? 1} passenger(s)
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5 border-t border-border pt-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-bold text-muted-foreground">Total</span>
              <span className="text-xl font-extrabold text-secondary">
                {formatPrice(String(totalAmount))}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 flex items-center justify-between gap-4 border-t border-border pt-8">
        <button
          type="button"
          onClick={onBack}
          disabled={isCreating}
          className="rounded-full border border-secondary px-8 py-3 text-sm font-extrabold text-secondary transition hover:bg-secondary/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isCreating || bookings.length === 0}
          className="rounded-full bg-secondary px-8 py-3 text-sm font-extrabold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-secondary/25"
        >
          {isCreating ? "Creating payment..." : "Create pending payment"}
        </button>
      </div>
    </section>
  );
}

function ConfirmationStep({
  bookings,
  payments,
  onViewBookings,
  onSearchAgain,
}: {
  bookings: Booking[];
  payments: Payment[];
  onViewBookings: () => void;
  onSearchAgain: () => void;
}) {
  return (
    <section className="mt-10">
      <div className="rounded-xl border border-mint/30 bg-white px-5 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-muted-foreground">Confirmation</p>
            <h2 className="mt-1 font-display text-2xl font-extrabold text-[#30343b]">
              Payment is pending
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Your booking and passenger details were saved. Payment records are now waiting for
              confirmation.
            </p>
          </div>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-extrabold text-amber-700">
            PENDING
          </span>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {bookings.map((booking) => {
            const payment = payments.find((item) => item.orderId === booking.orderId);

            return (
              <div
                key={booking.id}
                className="rounded-lg border border-border bg-muted/30 px-4 py-4"
              >
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Booking #{booking.id}
                </p>
                <p className="mt-1 text-sm font-extrabold text-[#30343b]">
                  {formatPrice(String(booking.totalAmount))}
                </p>
                <p className="mt-1 text-xs font-semibold text-muted-foreground">
                  Payment #{payment?.id ?? "-"} · {payment?.paymentMethod ?? "Processing"} ·{" "}
                  {payment?.status ?? "PENDING"}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onSearchAgain}
            className="rounded-full border border-secondary px-6 py-3 text-sm font-extrabold text-secondary transition hover:bg-secondary/10"
          >
            Search again
          </button>
          <button
            type="button"
            onClick={onViewBookings}
            className="rounded-full bg-secondary px-6 py-3 text-sm font-extrabold text-white transition hover:brightness-110"
          >
            View my bookings
          </button>
        </div>
      </div>
    </section>
  );
}

function SelectedFlightSummary({
  label,
  flight,
  passengerCount,
}: {
  label: string;
  flight: FlightSearchResult;
  passengerCount: number;
}) {
  const fare = Number(flight.price);
  const subtotal = fare * passengerCount;

  return (
    <div className="rounded-lg border border-border bg-muted/40 px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-extrabold text-[#30343b]">
        {flight.fromLocation} → {flight.toLocation}
      </p>
      <p className="mt-0.5 text-xs font-semibold text-muted-foreground">
        {formatTimeOnly(flight.departureDateTime)} · {flight.airline?.name ?? "SunJet Partner"}
      </p>
      <div className="mt-3 flex items-end justify-between gap-3 border-t border-border pt-3">
        <p className="text-xs font-semibold text-muted-foreground">
          {formatPrice(flight.price)} × {passengerCount} guest{passengerCount === 1 ? "" : "s"}
        </p>
        <p className="text-sm font-extrabold text-secondary">{formatPrice(String(subtotal))}</p>
      </div>
    </div>
  );
}

function PassengerInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-muted-foreground">
        {label}
        {required ? " *" : ""}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 h-11 w-full rounded-lg border border-border px-4 text-sm font-medium text-[#30343b] outline-none transition placeholder:text-muted-foreground/50 focus:border-secondary"
      />
    </label>
  );
}

function parseString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function parseTripType(value: unknown): "roundtrip" | "oneway" | undefined {
  return value === "roundtrip" || value === "oneway" ? value : undefined;
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

function buildPassengerForms(adults: number, children: number, infants: number) {
  return [
    ...Array.from({ length: adults }, () => createEmptyPassenger("ADULT")),
    ...Array.from({ length: children }, () => createEmptyPassenger("CHILD")),
    ...Array.from({ length: infants }, () => createEmptyPassenger("INFANT")),
  ];
}

function formatPassengerCategory(category: PassengerCategory) {
  if (category === "ADULT") return "Adult";
  if (category === "CHILD") return "Child";
  return "Infant";
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
