import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Building2,
  Calendar,
  ChevronDown,
  CreditCard,
  ExternalLink,
  Hash,
  Mail,
  Phone,
  Plane,
  PlaneLanding,
  PlaneTakeoff,
  RefreshCw,
  Repeat,
  Users,
  UserRound,
} from "lucide-react";
import { Header } from "@/components/home/Header";
import { Footer } from "@/components/home/Footer";
import { MetaChip } from "@/components/booking/MetaChip";
import { useAuthSession } from "@/hooks/use-auth-session";
import {
  createHostedInvoice,
  createPassenger,
  deletePassenger,
  getMyOrders,
  getPassengersByBooking,
  updatePassenger,
  type Booking,
  type OrderDetail,
  type Passenger,
  type PassengerCategory,
  type Payment,
  type PaymentMethod,
} from "@/lib/booking-api";
import {
  formatDate,
  formatDateParts,
  formatPassengerCategory,
  parsePassengerOtherDetails,
  paymentMethodLabels,
  paymentStatusStyles,
  statusBorderStyles,
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
  const [orders, setOrders] = useState<OrderDetail[] | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
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
  const [isRefreshing, setIsRefreshing] = useState(false);

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

    getMyOrders()
      .then((result) => {
        setOrders(result);
        setExpandedOrderId(null);
        setExpandedPaymentId(null);
        setPassengersByBooking({});
        setPassengerErrors({});
        setPaymentErrors({});
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load bookings"));
  }, [session, navigate]);

  const refreshOrders = async () => {
    const result = await getMyOrders();
    setOrders(result);
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshOrders();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to refresh bookings");
    } finally {
      setIsRefreshing(false);
    }
  };

  const togglePaymentDetails = (orderId: number) => {
    setExpandedPaymentId((current) => (current === orderId ? null : orderId));
  };

  const togglePassengerDetails = async (order: OrderDetail) => {
    if (expandedOrderId === order.id) {
      setExpandedOrderId(null);
      return;
    }

    setExpandedOrderId(order.id);

    const legsToLoad = order.bookings.filter((leg) => !passengersByBooking[leg.id]);
    if (legsToLoad.length === 0) return;

    setPassengerLoadingId(order.id);
    setPassengerErrors((current) => ({ ...current, [order.id]: "" }));

    try {
      const results = await Promise.all(legsToLoad.map((leg) => getPassengersByBooking(leg.id)));
      setPassengersByBooking((current) => {
        const next = { ...current };
        legsToLoad.forEach((leg, index) => {
          next[leg.id] = results[index];
        });
        return next;
      });
    } catch (err) {
      setPassengerErrors((current) => ({
        ...current,
        [order.id]: err instanceof Error ? err.message : "Unable to load passenger details",
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

  const handleDeletePassenger = async (bookingId: number, passengerId: number) => {
    setPassengerSavingKey(`delete-${passengerId}`);
    setPassengerErrors((current) => ({ ...current, [bookingId]: "" }));

    try {
      await deletePassenger(passengerId);
      await refreshPassengers(bookingId);
    } catch (err) {
      setPassengerErrors((current) => ({
        ...current,
        [bookingId]: err instanceof Error ? err.message : "Unable to remove passenger",
      }));
      throw err;
    } finally {
      setPassengerSavingKey(null);
    }
  };

  const handleCreatePayment = async (order: OrderDetail) => {
    setPaymentSavingId(order.id);
    setPaymentErrors((current) => ({ ...current, [order.id]: "" }));

    try {
      const paymentMethod = paymentMethodsByBooking[order.id] ?? "CARD";

      if (
        paymentMethod !== "CARD" &&
        paymentMethod !== "GCASH" &&
        paymentMethod !== "BANK_TRANSFER"
      ) {
        throw new Error("Select Card, GCash, or Bank transfer to continue to Xendit payment.");
      }

      const { invoiceUrl } = await createHostedInvoice(order.id, paymentMethod);
      window.location.assign(invoiceUrl);
    } catch (err) {
      setPaymentErrors((current) => ({
        ...current,
        [order.id]: err instanceof Error ? err.message : "Unable to create payment",
      }));
    } finally {
      setPaymentSavingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="max-w-[1400px] mx-auto px-6 pb-20 md:pt-40 pt-28">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-secondary md:block hidden">
              <PlaneTakeoff className="h-5 w-5" />
            </span>
            <div>
              <h1 className="font-display text-2xl font-extrabold text-secondary">My Bookings</h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                A list of all the flights you've booked with SunJet.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void handleManualRefresh()}
            disabled={isRefreshing}
            className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-secondary transition hover:border-secondary disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        <div className="mt-8">
          {error && <p className="text-sm font-medium text-accent">{error}</p>}

          {!error && orders === null && (
            <p className="text-sm text-muted-foreground">Loading your bookings…</p>
          )}

          {orders?.length === 0 && (
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

          {orders && orders.length > 0 && (
            <ul className="flex flex-col gap-5">
              {orders.map((order) => (
                <li
                  key={order.id}
                  className={`overflow-hidden rounded-2xl border border-l-4 border-border bg-card shadow-sm transition-shadow hover:shadow-md ${statusBorderStyles[order.status]}`}
                >
                  {(() => {
                    const latestPayment = getLatestPayment(order);
                    const legs = order.bookings;
                    const primaryLeg = legs[0];
                    const isRoundTrip = legs.some((leg) => leg.flightType === "ROUND_TRIP");
                    const passengerCount = primaryLeg?.passengers ?? 1;
                    const bookedDate = primaryLeg?.bookingDate ?? order.createdAt;

                    return (
                      <>
                        <div className="p-5 sm:p-6">
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <Link
                                to="/my-bookings/$bookingId"
                                params={{ bookingId: String(order.id) }}
                                className="group flex items-center gap-2.5"
                              >
                                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/15 text-secondary">
                                  <Plane className="h-4 w-4 -rotate-45" />
                                </span>
                                <span className="font-display text-lg font-extrabold leading-tight text-secondary group-hover:underline underline-offset-2">
                                  {primaryLeg?.flight
                                    ? `${primaryLeg.flight.fromLocation} → ${primaryLeg.flight.toLocation}`
                                    : `Order #${order.id}`}
                                </span>
                              </Link>
                              {primaryLeg?.flight?.airline && (
                                <p className="mt-1.5 flex items-center gap-1.5 pl-[46px] text-xs font-semibold text-muted-foreground">
                                  <Building2 className="h-3.5 w-3.5 shrink-0" />
                                  {primaryLeg.flight.airline.name}
                                </p>
                              )}
                            </div>

                            <div className="flex flex-row items-center gap-3 sm:flex-col sm:items-end">
                              <span
                                className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${statusStyles[order.status]}`}
                              >
                                {order.status}
                              </span>
                              <span className="text-xl font-extrabold text-secondary">
                                ₱{Number(order.totalAmount).toLocaleString()}
                              </span>
                            </div>
                          </div>

                          <div className="mt-4 flex flex-col gap-3">
                            {legs.map((leg) => (
                              <div
                                key={leg.id}
                                className="rounded-xl border border-border/70 bg-muted/30 px-4 py-3"
                              >
                                {isRoundTrip && (
                                  <p className="mb-2 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                                    {leg.flight
                                      ? `${leg.flight.fromLocation} → ${leg.flight.toLocation}`
                                      : `Leg #${leg.id}`}
                                  </p>
                                )}
                                {leg.flight && (
                                  <div className="flex max-w-sm items-center gap-2">
                                    <div className="flex flex-col">
                                      <span className="whitespace-nowrap text-sm font-bold text-secondary">
                                        {formatDateParts(leg.flight.departureDateTime).date}
                                      </span>
                                      <span className="whitespace-nowrap text-sm font-bold text-secondary">
                                        {formatDateParts(leg.flight.departureDateTime).time}
                                      </span>
                                      <span className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                        <PlaneTakeoff className="h-3 w-3" /> Departure
                                      </span>
                                    </div>
                                    <div className="flex flex-1 items-center gap-1 text-border">
                                      <span className="h-px flex-1 border-t border-dashed border-border" />
                                      <Plane className="h-3.5 w-3.5 shrink-0 text-primary" />
                                      <span className="h-px flex-1 border-t border-dashed border-border" />
                                    </div>
                                    <div className="flex flex-col text-right">
                                      <span className="whitespace-nowrap text-sm font-bold text-secondary">
                                        {formatDateParts(leg.flight.arrivalDateTime).date}
                                      </span>
                                      <span className="whitespace-nowrap text-sm font-bold text-secondary">
                                        {formatDateParts(leg.flight.arrivalDateTime).time}
                                      </span>
                                      <span className="mt-0.5 flex items-center justify-end gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                        Arrival <PlaneLanding className="h-3 w-3" />
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>

                          <div className="mt-4 flex flex-wrap items-center gap-1.5">
                            <MetaChip icon={Hash} label={`Order #${order.id}`} />
                            <MetaChip icon={Calendar} label={`Booked ${formatDate(bookedDate)}`} />
                            <MetaChip icon={Users} label={`${passengerCount} passenger(s)`} />
                            <MetaChip
                              icon={Repeat}
                              label={isRoundTrip ? "Round trip" : "One way"}
                            />
                          </div>
                        </div>

                        <div className="border-t border-border">
                          <div className="border-b border-border">
                            <button
                              type="button"
                              onClick={() => togglePaymentDetails(order.id)}
                              className="flex w-full items-center justify-between gap-2 px-5 py-3.5 text-left transition hover:bg-muted/40 active:scale-[0.99] sm:px-6"
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
                                className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
                                  expandedPaymentId === order.id ? "rotate-180" : ""
                                }`}
                              />
                            </button>
                            {expandedPaymentId === order.id && (
                              <div className="border-t border-border bg-muted/20 px-5 py-4 sm:px-6">
                                <PaymentPanel
                                  order={order}
                                  payment={latestPayment}
                                  selectedMethod={paymentMethodsByBooking[order.id] ?? "CARD"}
                                  isSaving={paymentSavingId === order.id}
                                  error={paymentErrors[order.id]}
                                  onMethodChange={(method) =>
                                    setPaymentMethodsByBooking((current) => ({
                                      ...current,
                                      [order.id]: method,
                                    }))
                                  }
                                  onCreatePayment={() => void handleCreatePayment(order)}
                                />
                              </div>
                            )}
                          </div>

                          <div>
                            <button
                              type="button"
                              onClick={() => void togglePassengerDetails(order)}
                              className="flex w-full items-center justify-between gap-2 px-5 py-3.5 text-left transition hover:bg-muted/40 active:scale-[0.99] sm:px-6"
                            >
                              <span className="flex items-center gap-2 text-sm font-bold text-secondary">
                                <UserRound className="h-4 w-4 text-primary" />
                                Passenger details
                              </span>
                              <ChevronDown
                                className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
                                  expandedOrderId === order.id ? "rotate-180" : ""
                                }`}
                              />
                            </button>
                            {expandedOrderId === order.id && (
                              <div className="flex flex-col gap-4 border-t border-border bg-muted/20 px-5 py-4 sm:px-6">
                                {legs.map((leg) => (
                                  <div key={leg.id}>
                                    {isRoundTrip && (
                                      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                                        {leg.flight
                                          ? `${leg.flight.fromLocation} → ${leg.flight.toLocation}`
                                          : `Leg #${leg.id}`}
                                      </p>
                                    )}
                                    <PassengerDetailsPanel
                                      booking={leg}
                                      passengers={passengersByBooking[leg.id]}
                                      isLoading={
                                        passengerLoadingId === order.id &&
                                        !passengersByBooking[leg.id]
                                      }
                                      savingKey={passengerSavingKey}
                                      error={passengerErrors[order.id]}
                                      onAddPassenger={(draft) => handleAddPassenger(leg, draft)}
                                      onUpdatePassenger={(passengerId, draft) =>
                                        handleUpdatePassenger(leg.id, passengerId, draft)
                                      }
                                      onDeletePassenger={(passengerId) =>
                                        handleDeletePassenger(leg.id, passengerId)
                                      }
                                    />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <Link
                          to="/my-bookings/$bookingId"
                          params={{ bookingId: String(order.id) }}
                          className="flex items-center justify-start gap-1.5 border-t border-border px-5 pt-3 pb-4 text-sm font-bold text-secondary transition hover:bg-muted/40 active:scale-[0.99] sm:px-6"
                        >
                          <ExternalLink className="h-4 w-4 text-primary" />
                          View full details
                        </Link>
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
  order,
  payment,
  selectedMethod,
  isSaving,
  error,
  onMethodChange,
  onCreatePayment,
}: {
  order: OrderDetail;
  payment?: Payment;
  selectedMethod: PaymentMethod;
  isSaving: boolean;
  error?: string;
  onMethodChange: (method: PaymentMethod) => void;
  onCreatePayment: () => void;
}) {
  const canCreatePayment =
    order.status !== "CANCELLED" &&
    (!payment || payment.status === "FAILED" || payment.status === "CANCELLED");

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
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
  onDeletePassenger,
}: {
  booking: Booking;
  passengers?: Passenger[];
  isLoading: boolean;
  savingKey: string | null;
  error?: string;
  onAddPassenger: (draft: PassengerDraft) => Promise<void>;
  onUpdatePassenger: (passengerId: number, draft: PassengerDraft) => Promise<void>;
  onDeletePassenger: (passengerId: number) => Promise<void>;
}) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-white px-4 py-5 text-sm font-medium text-muted-foreground">
        Loading passenger details...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-accent/20 bg-accent/5 px-4 py-5 text-sm font-medium text-accent">
        {error}
      </div>
    );
  }

  if (!passengers || passengers.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-white px-4 py-5">
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
    <div>
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
              isSaving={
                savingKey === `edit-${passenger.id}` || savingKey === `delete-${passenger.id}`
              }
              onSubmit={(draft) => onUpdatePassenger(passenger.id, draft)}
              onDelete={() => onDeletePassenger(passenger.id)}
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
            <p className="rounded-xl border border-border bg-white px-4 py-4 text-sm font-medium text-muted-foreground">
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
  onDelete,
}: {
  passenger: Passenger;
  canEdit: boolean;
  isSaving: boolean;
  onSubmit: (draft: PassengerDraft) => Promise<void>;
  onDelete: () => Promise<void>;
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
    <div className="rounded-xl border border-border bg-white px-4 py-4">
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
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              disabled={isSaving}
              className="rounded-full border border-border px-3 py-1 text-xs font-bold text-secondary transition hover:border-secondary disabled:opacity-60"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => {
                if (
                  window.confirm(
                    `Remove ${passenger.firstName} ${passenger.lastName} from this booking?`,
                  )
                ) {
                  void onDelete();
                }
              }}
              disabled={isSaving}
              className="rounded-full border border-accent/30 px-3 py-1 text-xs font-bold text-accent transition hover:bg-accent/5 disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Remove"}
            </button>
          </div>
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

function getLatestPayment(order: OrderDetail) {
  return order.payment ?? undefined;
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
