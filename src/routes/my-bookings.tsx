import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PlaneTakeoff } from "lucide-react";
import { Header } from "@/components/home/Header";
import { Footer } from "@/components/home/Footer";
import { useAuthSession } from "@/hooks/use-auth-session";
import { getMyBookings, type Booking } from "@/lib/booking-api";

export const Route = createFileRoute("/my-bookings")({
  component: MyBookingsPage,
  head: () => ({
    meta: [{ title: "My Bookings — SunJet" }],
  }),
});

const statusStyles: Record<Booking["status"], string> = {
  PENDING: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-mint/10 text-mint",
  CANCELLED: "bg-accent/10 text-accent",
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  });
}

function MyBookingsPage() {
  const session = useAuthSession();
  const navigate = Route.useNavigate();
  const [bookings, setBookings] = useState<Booking[] | null>(null);
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
      .then(setBookings)
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load bookings"));
  }, [session, navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="mx-auto max-w-4xl px-6 pb-20 pt-32">
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
                <li
                  key={booking.id}
                  className="flex flex-col gap-3 rounded-2xl border border-border bg-card px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-bold text-secondary">
                      {booking.flight
                        ? `${booking.flight.fromLocation} → ${booking.flight.toLocation}`
                        : `Booking #${booking.id}`}
                    </p>
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
                      Booked {formatDate(booking.bookingDate)} · {booking.passengers ?? 1}{" "}
                      passenger(s) ·{" "}
                      {booking.flightType === "ROUND_TRIP" ? "Round trip" : "One way"}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-secondary">
                      ₱{Number(booking.totalAmount).toLocaleString()}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyles[booking.status]}`}
                    >
                      {booking.status}
                    </span>
                  </div>
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
