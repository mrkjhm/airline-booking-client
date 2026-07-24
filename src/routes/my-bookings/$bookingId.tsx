import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Armchair,
  Building2,
  Calendar,
  CreditCard,
  Hash,
  Mail,
  Phone,
  Plane,
  PlaneLanding,
  PlaneTakeoff,
  Repeat,
  Ticket as TicketIcon,
  Users,
  UserRound,
} from "lucide-react";
import { Header } from "@/components/home/Header";
import { Footer } from "@/components/home/Footer";
import { MetaChip } from "@/components/booking/MetaChip";
import { useAuthSession } from "@/hooks/use-auth-session";
import {
  cancelBooking,
  getOrderDetail,
  type BookingDetail,
  type OrderDetail,
  type Ticket,
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

export const Route = createFileRoute("/my-bookings/$bookingId")({
  component: BookingDetailPage,
  head: () => ({
    meta: [{ title: "Booking Details — SunJet" }],
  }),
});

const ticketStatusStyles: Record<Ticket["status"], string> = {
  ISSUED: "bg-mint/10 text-mint",
  CHECKED_IN: "bg-sky-100 text-sky-700",
  CANCELLED: "bg-accent/10 text-accent",
};

const cabinClassLabels: Record<Ticket["cabinClass"], string> = {
  ECONOMY: "Economy",
  BUSINESS: "Business",
  FIRST_CLASS: "First class",
};

function BookingDetailPage() {
  const session = useAuthSession();
  const navigate = Route.useNavigate();
  const { bookingId } = Route.useParams();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

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

    const id = Number(bookingId);

    if (Number.isNaN(id)) {
      setError("Invalid booking id");
      return;
    }

    getOrderDetail(id)
      .then((result) => setOrder(result))
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load booking"));
  }, [session, navigate, bookingId]);

  const handleCancelBooking = async () => {
    if (!order) return;

    const confirmed = window.confirm(
      "Cancel this pending order? This will release the reserved seats for all of its flights.",
    );
    if (!confirmed) return;

    setIsCancelling(true);
    setCancelError(null);

    try {
      // Cancelling one leg cancels the whole pending order in the API. Calling every
      // leg would make the second request fail with "already cancelled".
      await cancelBooking(order.bookings[0].id);
      setOrder(await getOrderDetail(order.id));
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : "Unable to cancel booking");
    } finally {
      setIsCancelling(false);
    }
  };

  const isRoundTrip = (order?.bookings.length ?? 0) > 1;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="max-w-[1000px] mx-auto px-6 pb-20 pt-32">
        <Link
          to="/my-bookings"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground transition hover:text-secondary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to my bookings
        </Link>

        {error && (
          <div className="mt-8 rounded-2xl border border-accent/20 bg-accent/5 px-6 py-10 text-center text-sm font-medium text-accent">
            {error}
          </div>
        )}

        {!error && order === null && (
          <p className="mt-8 text-sm text-muted-foreground">Loading booking details…</p>
        )}

        {order && (
          <div className="mt-6 flex flex-col gap-6">
            <section
              className={`rounded-2xl border border-l-4 border-border bg-card px-6 py-5 ${statusBorderStyles[order.status]}`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="flex items-center gap-2 text-lg font-extrabold text-secondary">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/15 text-secondary">
                      <PlaneTakeoff className="h-4 w-4" />
                    </span>
                    Order #{order.id}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <MetaChip
                      icon={Users}
                      label={`${order.bookings[0]?.passengers ?? 1} passenger(s)`}
                    />
                    <MetaChip icon={Repeat} label={isRoundTrip ? "Round trip" : "One way"} />
                  </div>
                </div>

                <div className="flex flex-row items-center gap-3 sm:flex-col sm:items-end">
                  <span className="text-lg font-extrabold text-secondary">
                    ₱{Number(order.totalAmount).toLocaleString()}
                  </span>
                  <span
                    className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${statusStyles[order.status]}`}
                  >
                    {order.status}
                  </span>
                </div>
              </div>

              {order.status === "PENDING" && (
                <div className="mt-5 flex flex-col items-start gap-2 border-t border-border pt-4">
                  <button
                    type="button"
                    onClick={() => void handleCancelBooking()}
                    disabled={isCancelling}
                    className="rounded-full border border-accent/30 px-4 py-2 text-xs font-extrabold text-accent transition hover:bg-accent/5 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isCancelling ? "Cancelling..." : "Cancel booking"}
                  </button>
                  {cancelError && (
                    <p className="text-xs font-semibold text-accent">{cancelError}</p>
                  )}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-border bg-card px-6 py-5">
              <p className="flex items-center gap-2 text-sm font-extrabold text-secondary">
                <CreditCard className="h-4 w-4 text-primary" />
                Payments
              </p>

              {!order.payment ? (
                <p className="mt-3 text-xs font-semibold text-muted-foreground">
                  No payment has been created for this booking yet.
                </p>
              ) : (
                <div className="mt-3 grid gap-3">
                  {(() => {
                    const payment = order.payment;

                    return (
                      <div
                        key={payment.id}
                        className="flex flex-col gap-2 rounded-xl border border-border bg-muted/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="text-xs font-bold text-secondary">
                            Payment #{payment.id} · {paymentMethodLabels[payment.paymentMethod]}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            ₱{Number(payment.amount).toLocaleString()} ·{" "}
                            {formatDate(payment.paymentDate)}
                          </p>
                        </div>
                        <span
                          className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${paymentStatusStyles[payment.status]}`}
                        >
                          {payment.status}
                        </span>
                      </div>
                    );
                  })()}
                </div>
              )}
            </section>

            {order.bookings.map((booking, legIndex) => (
              <BookingLegSection
                key={booking.id}
                booking={booking}
                label={isRoundTrip ? (legIndex === 0 ? "Outbound flight" : "Return flight") : null}
              />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

function BookingLegSection({ booking, label }: { booking: BookingDetail; label: string | null }) {
  return (
    <section
      className={`rounded-2xl border border-l-4 border-border bg-card px-6 py-5 ${statusBorderStyles[booking.status]}`}
    >
      {label && (
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-primary">{label}</p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-base font-extrabold text-secondary">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/15 text-secondary">
              <Plane className="h-3.5 w-3.5 -rotate-45" />
            </span>
            {booking.flight
              ? `${booking.flight.fromLocation} → ${booking.flight.toLocation}`
              : `Booking #${booking.id}`}
          </p>

          {booking.flight?.airline && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Building2 className="h-3.5 w-3.5 shrink-0" />
              {booking.flight.airline.name}
            </p>
          )}

          {booking.flight && (
            <div className="mt-3 flex max-w-sm items-center gap-2">
              <div className="flex flex-col">
                <span className="whitespace-nowrap text-sm font-bold text-secondary">
                  {formatDateParts(booking.flight.departureDateTime).date}
                </span>
                <span className="whitespace-nowrap text-sm font-bold text-secondary">
                  {formatDateParts(booking.flight.departureDateTime).time}
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
                  {formatDateParts(booking.flight.arrivalDateTime).date}
                </span>
                <span className="whitespace-nowrap text-sm font-bold text-secondary">
                  {formatDateParts(booking.flight.arrivalDateTime).time}
                </span>
                <span className="mt-0.5 flex items-center justify-end gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Arrival <PlaneLanding className="h-3 w-3" />
                </span>
              </div>
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <MetaChip icon={Hash} label={`Booking #${booking.id}`} />
            <MetaChip icon={Calendar} label={`Booked ${formatDate(booking.bookingDate)}`} />
          </div>
        </div>

        <span
          className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${statusStyles[booking.status]}`}
        >
          {booking.status}
        </span>
      </div>

      <div className="mt-5 border-t border-border pt-4">
        <p className="flex items-center gap-2 text-sm font-extrabold text-secondary">
          <TicketIcon className="h-4 w-4 text-primary" />
          Tickets
        </p>

        {booking.tickets.length === 0 ? (
          <p className="mt-3 text-xs font-semibold text-muted-foreground">
            No tickets have been issued for this booking yet. Tickets are issued once payment is
            confirmed.
          </p>
        ) : (
          <div className="mt-3 grid gap-3">
            {booking.tickets.map((ticket) => {
              const passenger = booking.passengerDetails.find(
                (candidate) => candidate.id === ticket.passengerId,
              );

              return (
                <div
                  key={ticket.id}
                  className="flex flex-col gap-2 rounded-xl border border-border bg-muted/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-xs font-bold text-secondary">
                      {ticket.ticketNumber}
                      {passenger && ` · ${passenger.firstName} ${passenger.lastName}`}
                    </p>
                    <p className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                      {cabinClassLabels[ticket.cabinClass]}
                      {ticket.seatNumber && (
                        <span className="flex items-center gap-1">
                          <Armchair className="h-3.5 w-3.5" />
                          Seat {ticket.seatNumber}
                        </span>
                      )}
                      ₱{Number(ticket.fare).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${ticketStatusStyles[ticket.status]}`}
                  >
                    {ticket.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-5 border-t border-border pt-4">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Passenger Details
        </p>

        {booking.passengerDetails.length === 0 ? (
          <p className="mt-3 text-xs font-semibold text-muted-foreground">
            No passenger details saved for this booking yet.
          </p>
        ) : (
          <div className="mt-3 grid gap-3">
            {booking.passengerDetails.map((passenger) => {
              const extra = parsePassengerOtherDetails(passenger.otherDetails);

              return (
                <div
                  key={passenger.id}
                  className="rounded-xl border border-border bg-muted/30 px-4 py-4"
                >
                  <p className="flex items-center gap-2 text-sm font-extrabold text-secondary">
                    <UserRound className="h-4 w-4 text-primary" />
                    {passenger.firstName} {passenger.lastName}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-muted-foreground">
                    {formatPassengerCategory(passenger.passengerCategory)}
                  </p>

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
            })}
          </div>
        )}
      </div>
    </section>
  );
}
