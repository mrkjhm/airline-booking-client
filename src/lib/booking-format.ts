import type { Booking, Passenger, PaymentMethod, PaymentStatus } from "./booking-api";

export const statusStyles: Record<Booking["status"], string> = {
  PENDING: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-mint/10 text-mint",
  CANCELLED: "bg-accent/10 text-accent",
};

export const statusBorderStyles: Record<Booking["status"], string> = {
  PENDING: "border-l-amber-400",
  CONFIRMED: "border-l-mint",
  CANCELLED: "border-l-accent",
};

export const paymentStatusStyles: Record<PaymentStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  PAID: "bg-mint/10 text-mint",
  FAILED: "bg-accent/10 text-accent",
  CANCELLED: "bg-muted text-muted-foreground",
};

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  CASH: "Cash",
  CARD: "Card",
  GCASH: "GCash",
  BANK_TRANSFER: "Bank transfer",
  STRIPE: "Stripe",
};

export function formatDate(value?: string | null) {
  const date = value ? new Date(value) : null;

  if (!date || Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleString("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  });
}

export function formatDateParts(value?: string | null) {
  const date = value ? new Date(value) : null;

  if (!date || Number.isNaN(date.getTime())) {
    return { date: "Date unavailable", time: "" };
  }

  return {
    date: date.toLocaleDateString("en-PH", { dateStyle: "medium", timeZone: "Asia/Manila" }),
    time: date.toLocaleTimeString("en-PH", { timeStyle: "short", timeZone: "Asia/Manila" }),
  };
}

export function formatPassengerCategory(category: Passenger["passengerCategory"]) {
  if (category === "ADULT") return "Adult";
  if (category === "CHILD") return "Child";
  return "Infant";
}

export function parsePassengerOtherDetails(value?: string | null) {
  if (!value) return {};

  try {
    const parsed = JSON.parse(value) as {
      dateOfBirth?: string;
      passportNumber?: string;
      outboundFlightId?: number;
      returnFlightId?: number;
    };

    return parsed;
  } catch {
    return {};
  }
}
