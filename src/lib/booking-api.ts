import { authFetch } from "./auth-api";

export type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED";
export type FlightType = "ONE_WAY" | "ROUND_TRIP";

export type BookingFlight = {
  id: number;
  fromLocation: string;
  toLocation: string;
  departureDateTime: string;
  arrivalDateTime: string;
  price?: string;
  airline?: { name: string; logoUrl?: string };
};

export type Booking = {
  id: number;
  flightId: number;
  passengers?: number;
  bookingDate: string;
  flightType: FlightType;
  totalAmount: string;
  status: BookingStatus;
  flight?: BookingFlight;
};

export async function getMyBookings(): Promise<Booking[]> {
  const response = await authFetch("/booking/my-bookings");

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message ?? "Unable to load bookings");
  }

  return data.bookings as Booking[];
}
