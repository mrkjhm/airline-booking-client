import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ChevronDown,
  CreditCard,
  ExternalLink,
  Mail,
  Phone,
  PlaneTakeoff,
  UserRound,
} from "lucide-react";
import { Header } from "@/components/home/Header";
import { Footer } from "@/components/home/Footer";
import { useAuthSession } from "@/hooks/use-auth-session";
import {
  createPayment,
  createPassenger,
  getMyBookings,
  getPassengersByBooking,
  updatePassenger,
  type Booking,
  type Passenger,
  type PassengerCategory,
  type Payment,
  type PaymentMethod,
} from "@/lib/booking-api";
import {
  formatDate,
  formatPassengerCategory,
  parsePassengerOtherDetails,
  paymentMethodLabels,
  paymentStatusStyles,
  statusStyles,
} from "@/lib/booking-format";

export const Route = createFileRoute("/my-bookings/")({
  component: MyBookingsPage,
  head: () => ({
    meta: [{ title: "My Bookings — SunJet" }],
  }),
});

type PassengerDraft = {
  firstName: string;
  lastName: string;
  email: string;
  mobileNumber: string;
  passengerCategory: PassengerCategory;
  dateOfBirth: string;
  passportNumber: string;
  baggageDetails: string;
};

const emptyPassengerDraft = (): PassengerDraft => ({
  firstName: "",
  lastName: "",
  email: "",
  mobileNumber: "",
  passengerCategory: "ADULT",
  dateOfBirth: "",
  passportNumber: "",
  baggageDetails: "",
});

function MyBookingsPage() {
  const session = useAuthSession();
  const navigate = Route.useNavigate();
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [expandedBookingId, setExpandedBookingId] = useState<number | null>(null);
  const [expandedPaymentId, setExpandedPaymentId] = useState<number | null>(null);
  const [passengersByBooking, setPassengersByBooking] = useState<Record<number, Passenger[]>>({});
  const [passengerLoadingId, setPassengerLoadingId] = useState<number | null>(null);
  const [passengerSavingKey, setPassengerSavingKey] = useState<string | null>(null);
  const [passengerErrors, setPassengerErrors] = useState<Record<number, string>>({});
  const [paymentSavingId, setPaymentSavingId] = useState<number | null>(null);
  const [paymentMethodsByBooking, setPaymentMethodsByBooking] = useState<
    Record<number, PaymentMethod>
  >({});
  const [paymentErrors, setPaymentErrors] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.style.overflowY = "scroll";
    return () => {
      document.documentElement.style.overflowY = "";
    };
  }, []);

  useEffect(() => {
    if (session === undefined) return;

    if (session === null) {
      navigate({ to: "/login" });
      return;
    }

    getMyBookings()
      .then((result) => {
        setBookings(result);
        setExpandedBookingId(null);
        setExpandedPaymentId(null);
        setPassengersByBooking({});
        setPassengerErrors({});
        setPaymentErrors({});
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load bookings"));
  }, [session, navigate]);

  const refreshBookings = async () => {
    const result = await getMyBookings();
    setBookings(result);
  };

  const togglePaymentDetails = (bookingId: number) => {
    setExpandedPaymentId((current) => (current === bookingId ? null : bookingId));
  };

  const togglePassengerDetails = async (bookingId: number) => {
    if (expandedBookingId === bookingId) {
      setExpandedBookingId(null);
      return;
    }

    setExpandedBookingId(bookingId);

    if (passengersByBooking[bookingId]) return;

    setPassengerLoadingId(bookingId);
    setPassengerErrors((current) => ({ ...current, [bookingId]: "" }));

    try {
      const passengers = await getPassengersByBooking(bookingId);
      setPassengersByBooking((current) => ({ ...current, [bookingId]: passengers }));
    } catch (err) {
      setPassengerErrors((current) => ({
        ...current,
        [bookingId]: err instanceof Error ? err.message : "Unable to load passenger details",
      }));
    } finally {
      setPassengerLoadingId(null);
    }
  };

  const refreshPassengers = async (bookingId: number) => {
    const passengers = await getPassengersByBooking(bookingId);
    setPassengersByBooking((current) => ({ ...current, [bookingId]: passengers }));
  };

  const handleAddPassenger = async (booking: Booking, draft: PassengerDraft) => {
    setPassengerSavingKey(`add-${booking.id}`);
    setPassengerErrors((current) => ({ ...current, [booking.id]: "" }));

    try {
      await createPassenger({
        bookingId: booking.id,
        ...passengerDraftToPayload(draft),
      });
      await refreshPassengers(booking.id);
    } catch (err) {
      setPassengerErrors((current) => ({
        ...current,
        [booking.id]: err instanceof Error ? err.message : "Unable to add passenger",
      }));
      throw err;
    } finally {
      setPassengerSavingKey(null);
    }
  };

  const handleUpdatePassenger = async (
    bookingId: number,
    passengerId: number,
    draft: PassengerDraft,
  ) => {
    setPassengerSavingKey(`edit-${passengerId}`);
    setPassengerErrors((current) => ({ ...current, [bookingId]: "" }));

    try {
      await updatePassenger(passengerId, passengerDraftToPayload(draft));
      await refreshPassengers(bookingId);
    } catch (err) {
      setPassengerErrors((current) => ({
        ...current,
        [bookingId]: err instanceof Error ? err.message : "Unable to update passenger",
      }));
      throw err;
    } finally {
      setPassengerSavingKey(null);
    }
  };

  const handleCreatePayment = async (booking: Booking) => {
    setPaymentSavingId(booking.id);
    setPaymentErrors((current) => ({ ...current, [booking.id]: "" }));

    try {
      await createPayment({
        bookingId: booking.id,
        paymentMethod: paymentMethodsByBooking[booking.id] ?? "CARD",
      });
      await refreshBookings();
    } catch (err) {
      setPaymentErrors((current) => ({
        ...current,
        [booking.id]: err instanceof Error ? err.message : "Unable to create payment",
      }));
    } finally {
      setPaymentSavingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="max-w-[1400px] mx-auto px-6 pb-20 pt-32">
        <h1 className="font-display text-2xl font-extrabold text-secondary">My Bookings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A list of all the flights you've booked with SunJet.
        </p>

        <div className="mt-8">
          {error && <p className="text-sm font-medium text-accent">{error}</p>}

          {!error && bookings === null && (
            <p className="text-sm text-muted-foreground">Loading your bookings…</p>
          )}

          {bookings?.length === 0 && (
            <div className="rounded-2xl border border-border bg-muted/40 px-6 py-14 text-center">
              <PlaneTakeoff className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 text-sm font-semibold text-secondary">No bookings yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Once you book a flight, it will show up here.
              </p>
              <Link
                to="/"
                className="mt-5 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition hover:brightness-95"
              >
                Search flights
              </Link>
            </div>
          )}

          {bookings && bookings.length > 0 && (
            <ul className="flex flex-col gap-4">
              {bookings.map((booking) => (
                <li key={booking.id} className="rounded-2xl border border-border bg-card px-5 py-4">
                  {(() => {
                    const latestPayment = getLatestPayment(booking);

                    return (
                      <>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <Link
                              to="/my-bookings/$bookingId"
                              params={{ bookingId: String(booking.id) }}
                              className="text-sm font-bold text-secondary underline-offset-2 hover:underline"
                            >
                              {booking.flight
                                ? `${booking.flight.fromLocation} → ${booking.flight.toLocation}`
                                : `Booking #${booking.id}`}
                            </Link>
                            {booking.flight?.airline && (
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {booking.flight.airline.name}
                              </p>
                            )}
                            {booking.flight && (
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                Departs {formatDate(booking.flight.departureDateTime)} · Arrives{" "}
                                {formatDate(booking.flight.arrivalDateTime)}
                              </p>
                            )}
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              Booking #{booking.id} · Booked {formatDate(booking.bookingDate)} ·{" "}
                              {booking.passengers ?? 1} passenger(s) ·{" "}
                              {booking.flightType === "ROUND_TRIP" ? "Round trip" : "One way"}
                            </p>
                          </div>

                          <div className="flex flex-row items-center gap-3 sm:flex-col sm:items-end">
                            <span className="text-base font-extrabold text-secondary">
                              ₱{Number(booking.totalAmount).toLocaleString()}
                            </span>
                            <span
                              className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${statusStyles[booking.status]}`}
                            >
                              {booking.status}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-1 divide-y divide-border overflow-hidden rounded-xl border border-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                          <button
                            type="button"
                            onClick={() => togglePaymentDetails(booking.id)}
                            className="flex items-center justify-between gap-2 px-4 py-3 text-left transition hover:bg-muted/40"
                          >
                            <span className="flex items-center gap-2 text-sm font-bold text-secondary">
                              <CreditCard className="h-4 w-4 text-primary" />
                              Payment
                              {latestPayment && (
                                <span
                                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${paymentStatusStyles[latestPayment.status]}`}
                                >
                                  {latestPayment.status}
                                </span>
                              )}
                            </span>
                            <ChevronDown
                              className={`h-4 w-4 shrink-0 text-muted-foreground transition ${
                                expandedPaymentId === booking.id ? "rotate-180" : ""
                              }`}
                            />
                          </button>
                          <button
                            type="button"
                            onClick={() => void togglePassengerDetails(booking.id)}
                            className="flex items-center justify-between gap-2 px-4 py-3 text-left transition hover:bg-muted/40"
                          >
                            <span className="flex items-center gap-2 text-sm font-bold text-secondary">
                              <UserRound className="h-4 w-4 text-primary" />
                              Passenger details
                            </span>
                            <ChevronDown
                              className={`h-4 w-4 shrink-0 text-muted-foreground transition ${
                                expandedBookingId === booking.id ? "rotate-180" : ""
                              }`}
                            />
                          </button>
                          <Link
                            to="/my-bookings/$bookingId"
                            params={{ bookingId: String(booking.id) }}
                            className="flex items-center justify-between gap-2 px-4 py-3 text-left transition hover:bg-muted/40"
                          >
                            <span className="flex items-center gap-2 text-sm font-bold text-secondary">
                              <ExternalLink className="h-4 w-4 text-primary" />
                              View full details
                            </span>
                          </Link>
                        </div>

                        {expandedPaymentId === booking.id && (
                          <PaymentPanel
                            booking={booking}
                            payment={latestPayment}
                            selectedMethod={paymentMethodsByBooking[booking.id] ?? "CARD"}
                            isSaving={paymentSavingId === booking.id}
                            error={paymentErrors[booking.id]}
                            onMethodChange={(method) =>
                              setPaymentMethodsByBooking((current) => ({
                                ...current,
                                [booking.id]: method,
                              }))
                            }
                            onCreatePayment={() => void handleCreatePayment(booking)}
                          />
                        )}

                        {expandedBookingId === booking.id && (
                          <PassengerDetailsPanel
                            booking={booking}
                            passengers={passengersByBooking[booking.id]}
                            isLoading={passengerLoadingId === booking.id}
                            savingKey={passengerSavingKey}
                            error={passengerErrors[booking.id]}
                            onAddPassenger={(draft) => handleAddPassenger(booking, draft)}
                            onUpdatePassenger={(passengerId, draft) =>
                              handleUpdatePassenger(booking.id, passengerId, draft)
                            }
                          />
                        )}
                      </>
                    );
                  })()}
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

function PaymentPanel({
  booking,
  payment,
  selectedMethod,
  isSaving,
  error,
  onMethodChange,
  onCreatePayment,
}: {
  booking: Booking;
  payment?: Payment;
  selectedMethod: PaymentMethod;
  isSaving: boolean;
  error?: string;
  onMethodChange: (method: PaymentMethod) => void;
  onCreatePayment: () => void;
}) {
  const canCreatePayment =
    booking.status !== "CANCELLED" &&
    (!payment || payment.status === "FAILED" || payment.status === "CANCELLED");

  return (
    <div className="mt-4 rounded-xl border border-border bg-muted/30 px-4 py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-extrabold text-secondary">
            <CreditCard className="h-4 w-4 text-primary" />
            Payment
          </p>
          {payment ? (
            <p className="mt-1 text-xs font-semibold text-muted-foreground">
              Payment #{payment.id} · {paymentMethodLabels[payment.paymentMethod]} ·{" "}
              {formatDate(payment.paymentDate)}
            </p>
          ) : (
            <p className="mt-1 text-xs font-semibold text-muted-foreground">
              No payment has been created for this booking yet.
            </p>
          )}
        </div>

        {payment && (
          <span
            className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${paymentStatusStyles[payment.status]}`}
          >
            {payment.status}
          </span>
        )}
      </div>

      {payment?.status === "PENDING" && (
        <p className="mt-3 text-xs font-semibold text-muted-foreground">
          Payment is waiting for confirmation. Once it is marked paid, the booking can be confirmed
          and tickets can be issued.
        </p>
      )}

      {payment?.status === "PAID" && (
        <p className="mt-3 text-xs font-semibold text-mint">
          Payment received. Your booking is ready for ticket issuance.
        </p>
      )}

      {payment?.status === "FAILED" && (
        <p className="mt-3 text-xs font-semibold text-accent">
          Payment failed. Choose a method and create a new payment attempt.
        </p>
      )}

      {payment?.status === "CANCELLED" && (
        <p className="mt-3 text-xs font-semibold text-muted-foreground">
          Payment was cancelled. You can create a new payment attempt if the booking is still open.
        </p>
      )}

      {canCreatePayment && (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <select
            value={selectedMethod}
            onChange={(event) => onMethodChange(event.target.value as PaymentMethod)}
            disabled={isSaving}
            className="h-10 rounded-lg border border-border bg-white px-3 text-sm font-bold text-secondary outline-none transition focus:border-secondary disabled:opacity-60"
          >
            <option value="CARD">Card</option>
            <option value="GCASH">GCash</option>
            <option value="BANK_TRANSFER">Bank transfer</option>
            <option value="CASH">Cash</option>
            <option value="STRIPE">Stripe</option>
          </select>
          <button
            type="button"
            onClick={onCreatePayment}
            disabled={isSaving}
            className="rounded-full bg-secondary px-4 py-2 text-xs font-extrabold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-secondary/25"
          >
            {isSaving ? "Creating..." : payment ? "Retry payment" : "Create payment"}
          </button>
        </div>
      )}

      {error && <p className="mt-3 text-xs font-semibold text-accent">{error}</p>}
    </div>
  );
}

function PassengerDetailsPanel({
  booking,
  passengers,
  isLoading,
  savingKey,
  error,
  onAddPassenger,
  onUpdatePassenger,
}: {
  booking: Booking;
  passengers?: Passenger[];
  isLoading: boolean;
  savingKey: string | null;
  error?: string;
  onAddPassenger: (draft: PassengerDraft) => Promise<void>;
  onUpdatePassenger: (passengerId: number, draft: PassengerDraft) => Promise<void>;
}) {
  if (isLoading) {
    return (
      <div className="mt-4 rounded-xl border border-border bg-muted/30 px-4 py-5 text-sm font-medium text-muted-foreground">
        Loading passenger details...
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-4 rounded-xl border border-accent/20 bg-accent/5 px-4 py-5 text-sm font-medium text-accent">
        {error}
      </div>
    );
  }

  if (!passengers || passengers.length === 0) {
    return (
      <div className="mt-4 rounded-xl border border-border bg-muted/30 px-4 py-5">
        <p className="text-sm font-medium text-muted-foreground">
          No passenger details saved for this booking yet.
        </p>
        {booking.status === "PENDING" && (
          <AddPassengerForm
            booking={booking}
            currentPassengerCount={0}
            isSaving={savingKey === `add-${booking.id}`}
            onSubmit={onAddPassenger}
          />
        )}
      </div>
    );
  }

  const currentPassengerCount = passengers.length;
  const passengerLimit = booking.passengers ?? currentPassengerCount;
  const canAddPassenger = booking.status === "PENDING" && currentPassengerCount < passengerLimit;

  return (
    <div className="mt-4 border-t border-border pt-4">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
        Passenger Details
      </p>
      <div className="mt-3 grid gap-3">
        {passengers.map((passenger) => {
          return (
            <PassengerCard
              key={passenger.id}
              passenger={passenger}
              canEdit={booking.status === "PENDING"}
              isSaving={savingKey === `edit-${passenger.id}`}
              onSubmit={(draft) => onUpdatePassenger(passenger.id, draft)}
            />
          );
        })}
      </div>

      {booking.status === "PENDING" && (
        <div className="mt-4">
          {canAddPassenger ? (
            <AddPassengerForm
              booking={booking}
              currentPassengerCount={currentPassengerCount}
              isSaving={savingKey === `add-${booking.id}`}
              onSubmit={onAddPassenger}
            />
          ) : (
            <p className="rounded-xl border border-border bg-muted/30 px-4 py-4 text-sm font-medium text-muted-foreground">
              Passenger limit reached for this booking. To add more passengers, the backend needs a
              booking-change endpoint that increases the booking passenger count and reserves more
              seats.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function PassengerCard({
  passenger,
  canEdit,
  isSaving,
  onSubmit,
}: {
  passenger: Passenger;
  canEdit: boolean;
  isSaving: boolean;
  onSubmit: (draft: PassengerDraft) => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const extra = parsePassengerOtherDetails(passenger.otherDetails);

  if (isEditing) {
    return (
      <PassengerEditor
        initialDraft={passengerToDraft(passenger)}
        submitLabel="Save changes"
        isSaving={isSaving}
        onCancel={() => setIsEditing(false)}
        onSubmit={async (draft) => {
          await onSubmit(draft);
          setIsEditing(false);
        }}
      />
    );
  }

  return (
    <div className="rounded-xl border border-border bg-muted/30 px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-extrabold text-secondary">
            <UserRound className="h-4 w-4 text-primary" />
            {passenger.firstName} {passenger.lastName}
          </p>
          <p className="mt-1 text-xs font-semibold text-muted-foreground">
            {formatPassengerCategory(passenger.passengerCategory)}
          </p>
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="rounded-full border border-border px-3 py-1 text-xs font-bold text-secondary transition hover:border-secondary"
          >
            Edit
          </button>
        )}
      </div>

      <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
        {passenger.email && (
          <p className="flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5" />
            {passenger.email}
          </p>
        )}
        {passenger.mobileNumber && (
          <p className="flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5" />
            {passenger.mobileNumber}
          </p>
        )}
        {extra.dateOfBirth && <p>Date of birth: {extra.dateOfBirth}</p>}
        {extra.passportNumber && <p>Document no.: {extra.passportNumber}</p>}
        {passenger.baggageDetails && <p>Baggage: {passenger.baggageDetails}</p>}
      </div>
    </div>
  );
}

function AddPassengerForm({
  booking,
  currentPassengerCount,
  isSaving,
  onSubmit,
}: {
  booking: Booking;
  currentPassengerCount: number;
  isSaving: boolean;
  onSubmit: (draft: PassengerDraft) => Promise<void>;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const passengerLimit = booking.passengers ?? currentPassengerCount;

  if (!isAdding) {
    return (
      <button
        type="button"
        onClick={() => setIsAdding(true)}
        className="mt-4 rounded-full bg-secondary px-4 py-2 text-xs font-extrabold text-white transition hover:brightness-110"
      >
        Add passenger ({currentPassengerCount}/{passengerLimit})
      </button>
    );
  }

  return (
    <div className="mt-4">
      <PassengerEditor
        initialDraft={emptyPassengerDraft()}
        submitLabel="Add passenger"
        isSaving={isSaving}
        onCancel={() => setIsAdding(false)}
        onSubmit={async (draft) => {
          await onSubmit(draft);
          setIsAdding(false);
        }}
      />
    </div>
  );
}

function PassengerEditor({
  initialDraft,
  submitLabel,
  isSaving,
  onCancel,
  onSubmit,
}: {
  initialDraft: PassengerDraft;
  submitLabel: string;
  isSaving: boolean;
  onCancel: () => void;
  onSubmit: (draft: PassengerDraft) => Promise<void>;
}) {
  const [draft, setDraft] = useState<PassengerDraft>(initialDraft);
  const [localError, setLocalError] = useState<string | null>(null);

  const setField = (field: keyof PassengerDraft, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setLocalError(null);
  };

  const handleSubmit = async () => {
    if (!draft.firstName.trim() || !draft.lastName.trim()) {
      setLocalError("First name and last name are required");
      return;
    }

    try {
      await onSubmit(draft);
    } catch {
      // Parent panel renders the backend error.
    }
  };

  return (
    <div className="rounded-xl border border-border bg-white px-4 py-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <PassengerField
          label="First name"
          value={draft.firstName}
          onChange={(value) => setField("firstName", value)}
          required
        />
        <PassengerField
          label="Last name"
          value={draft.lastName}
          onChange={(value) => setField("lastName", value)}
          required
        />
        <PassengerField
          label="Email"
          type="email"
          value={draft.email}
          onChange={(value) => setField("email", value)}
        />
        <PassengerField
          label="Mobile number"
          type="tel"
          value={draft.mobileNumber}
          onChange={(value) => setField("mobileNumber", value)}
        />
        <PassengerField
          label="Date of birth"
          type="date"
          value={draft.dateOfBirth}
          onChange={(value) => setField("dateOfBirth", value)}
        />
        <PassengerField
          label="Document no."
          value={draft.passportNumber}
          onChange={(value) => setField("passportNumber", value)}
        />
      </div>

      <label className="mt-3 block">
        <span className="text-xs font-bold text-muted-foreground">Passenger category</span>
        <select
          value={draft.passengerCategory}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              passengerCategory: event.target.value as PassengerCategory,
            }))
          }
          className="mt-1 h-10 w-full rounded-lg border border-border bg-white px-3 text-sm font-medium text-secondary outline-none focus:border-secondary"
        >
          <option value="ADULT">Adult</option>
          <option value="CHILD">Child</option>
          <option value="INFANT">Infant</option>
        </select>
      </label>

      <label className="mt-3 block">
        <span className="text-xs font-bold text-muted-foreground">Baggage details</span>
        <textarea
          value={draft.baggageDetails}
          onChange={(event) => setField("baggageDetails", event.target.value)}
          className="mt-1 min-h-20 w-full rounded-lg border border-border px-3 py-2 text-sm font-medium text-secondary outline-none focus:border-secondary"
        />
      </label>

      {localError && <p className="mt-3 text-xs font-semibold text-accent">{localError}</p>}

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="rounded-full border border-border px-4 py-2 text-xs font-bold text-secondary disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={isSaving}
          className="rounded-full bg-secondary px-4 py-2 text-xs font-extrabold text-white disabled:opacity-60"
        >
          {isSaving ? "Saving..." : submitLabel}
        </button>
      </div>
    </div>
  );
}

function PassengerField({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-muted-foreground">
        {label}
        {required ? " *" : ""}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 h-10 w-full rounded-lg border border-border px-3 text-sm font-medium text-secondary outline-none focus:border-secondary"
      />
    </label>
  );
}

function getLatestPayment(booking: Booking) {
  return booking.payments?.[0];
}

function passengerToDraft(passenger: Passenger): PassengerDraft {
  const extra = parsePassengerOtherDetails(passenger.otherDetails);

  return {
    firstName: passenger.firstName,
    lastName: passenger.lastName,
    email: passenger.email ?? "",
    mobileNumber: passenger.mobileNumber ?? "",
    passengerCategory: passenger.passengerCategory,
    dateOfBirth: extra.dateOfBirth ?? "",
    passportNumber: extra.passportNumber ?? "",
    baggageDetails: passenger.baggageDetails ?? "",
  };
}

function passengerDraftToPayload(draft: PassengerDraft) {
  return {
    firstName: draft.firstName.trim(),
    lastName: draft.lastName.trim(),
    email: draft.email.trim() || undefined,
    mobileNumber: draft.mobileNumber.trim() || undefined,
    passengerCategory: draft.passengerCategory,
    baggageDetails: draft.baggageDetails.trim() || undefined,
    otherDetails: JSON.stringify({
      dateOfBirth: draft.dateOfBirth || undefined,
      passportNumber: draft.passportNumber.trim() || undefined,
    }),
  };
}
