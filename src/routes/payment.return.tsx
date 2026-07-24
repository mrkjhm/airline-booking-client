import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { getMyPayments, type Payment } from "@/lib/booking-api";
import { Header } from "@/components/home/Header";

type PaymentReturnSearch = {
  paymentId?: number;
};

export const Route = createFileRoute("/payment/return")({
  validateSearch: (search: Record<string, unknown>): PaymentReturnSearch => {
    const numberValue = Number(search.paymentId);
    return {
      paymentId: Number.isInteger(numberValue) && numberValue > 0 ? numberValue : undefined,
    };
  },
  component: PaymentReturnPage,
  head: () => ({
    meta: [{ title: "Confirming Payment - SunJet" }],
  }),
});

const POLL_INTERVAL_MS = 2000;
const MAX_ATTEMPTS = 15; // ~30 seconds of polling before giving up

function PaymentReturnPage() {
  const { paymentId } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!paymentId) {
      setError("Missing payment reference");
      return;
    }

    let cancelled = false;

    const poll = async () => {
      try {
        const payments = await getMyPayments();
        const match = payments.find((item) => item.id === paymentId);

        if (cancelled) return;

        if (
          match &&
          (match.status === "PAID" || match.status === "FAILED" || match.status === "CANCELLED")
        ) {
          setPayment(match);
          return;
        }

        setPayment(match ?? null);
        setAttempts((current) => current + 1);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to check payment status");
        }
      }
    };

    void poll();
    timeoutRef.current = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(timeoutRef.current);
    };
  }, [paymentId]);

  useEffect(() => {
    if (attempts >= MAX_ATTEMPTS) {
      clearInterval(timeoutRef.current);
    }
  }, [attempts]);

  const isPaid = payment?.status === "PAID";
  const isFailed = payment?.status === "FAILED";
  const isCancelled = payment?.status === "CANCELLED";
  const timedOut = attempts >= MAX_ATTEMPTS && !isPaid && !isFailed && !isCancelled;

  return (
    <div className="min-h-screen bg-[#f5f6f8]">
      <Header />
      <main className="flex min-h-screen items-center justify-center px-6 pt-32 text-center">
        <div className="max-w-md rounded-xl border border-border bg-white px-8 py-10 shadow-sm">
          {error && <p className="text-sm font-semibold text-accent">{error}</p>}

          {!error && !isPaid && !isFailed && !isCancelled && !timedOut && (
            <>
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-secondary" />
              <p className="mt-4 text-lg font-extrabold text-[#30343b]">Confirming your payment</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Please wait, this usually takes a few seconds.
              </p>
            </>
          )}

          {isPaid && (
            <>
              <CheckCircle2 className="mx-auto h-10 w-10 text-mint" />
              <p className="mt-4 text-lg font-extrabold text-[#30343b]">Payment successful</p>
              <p className="mt-1 text-sm text-muted-foreground">Your booking is now confirmed.</p>
              <button
                type="button"
                onClick={() => void navigate({ to: "/my-bookings" })}
                className="mt-6 rounded-full bg-secondary px-6 py-3 text-sm font-extrabold text-white transition hover:brightness-110"
              >
                View my bookings
              </button>
            </>
          )}

          {(isFailed || isCancelled || timedOut) && (
            <>
              <XCircle className="mx-auto h-10 w-10 text-accent" />
              <p className="mt-4 text-lg font-extrabold text-[#30343b]">
                {isFailed
                  ? "Payment failed"
                  : isCancelled
                    ? "Payment cancelled"
                    : "Still processing"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {isFailed || isCancelled
                  ? "The payment was not completed. You can try again."
                  : "This is taking longer than expected. Check your bookings later — you'll be notified once confirmed."}
              </p>
              <button
                type="button"
                onClick={() => void navigate({ to: "/my-bookings" })}
                className="mt-6 rounded-full border border-secondary px-6 py-3 text-sm font-extrabold text-secondary transition hover:bg-secondary/10"
              >
                Go to my bookings
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
