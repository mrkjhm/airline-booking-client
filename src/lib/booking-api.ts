import { authFetch } from "./auth-api";

export type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED";
export type FlightType = "ONE_WAY" | "ROUND_TRIP";
export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "CANCELLED";
export type PaymentMethod = "CASH" | "CARD" | "GCASH" | "BANK_TRANSFER" | "STRIPE";
export type CabinClass = "ECONOMY" | "BUSINESS" | "FIRST_CLASS";
export type TicketStatus = "ISSUED" | "CANCELLED" | "CHECKED_IN";

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
  payments?: Payment[];
};

export type Payment = {
  id: number;
  bookingId: number;
  amount: string;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateBookingPayload = {
  flightId: number;
  passengers: number;
  flightType: FlightType;
};

export type CreatePaymentPayload = {
  bookingId: number;
  paymentMethod: PaymentMethod;
};

export type PassengerCategory = "ADULT" | "CHILD" | "INFANT";

export type CreatePassengerPayload = {
  bookingId: number;
  firstName: string;
  lastName: string;
  email?: string;
  mobileNumber?: string;
  passengerCategory: PassengerCategory;
  baggageDetails?: string;
  otherDetails?: string;
};

export type UpdatePassengerPayload = Omit<Partial<CreatePassengerPayload>, "bookingId">;

export type Passenger = {
  id: number;
  bookingId: number;
  firstName: string;
  lastName: string;
  email?: string | null;
  mobileNumber?: string | null;
  passengerCategory: PassengerCategory;
  baggageDetails?: string | null;
  otherDetails?: string | null;
};

export type Ticket = {
  id: number;
  passengerId: number;
  ticketNumber: string;
  cabinClass: CabinClass;
  fare: string;
  seatNumber?: string | null;
  status: TicketStatus;
};

export type BookingDetail = Omit<Booking, "payments"> & {
  passengerDetails: Passenger[];
  tickets: Ticket[];
  payments: Payment[];
};

type BookingResponse = {
  message: string;
  booking: Booking;
};

type BookingDetailResponse = {
  message: string;
  booking: BookingDetail;
};

type PassengerResponse = {
  message: string;
  passenger: Passenger;
};

type PaymentResponse = {
  message: string;
  newPayment: Payment;
};

type PassengersResponse = {
  message: string;
  passengers: Passenger[];
};

export async function getMyBookings(): Promise<Booking[]> {
  const response = await authFetch("/booking/my-bookings");

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message ?? "Unable to load bookings");
  }

  return data.bookings as Booking[];
}

export async function getBookingDetail(bookingId: number): Promise<BookingDetail> {
  const response = await authFetch(`/booking/my-bookings/${bookingId}`);

  const data = (await response.json().catch(() => ({}))) as Partial<BookingDetailResponse> & {
    message?: string;
  };

  if (!response.ok || !data.booking) {
    throw new Error(data.message ?? "Unable to load booking");
  }

  return data.booking;
}

export async function cancelBooking(bookingId: number): Promise<Booking> {
  const response = await authFetch(`/booking/${bookingId}/cancel`, {
    method: "PATCH",
  });

  const data = (await response.json().catch(() => ({}))) as Partial<BookingResponse> & {
    message?: string;
  };

  if (!response.ok || !data.booking) {
    throw new Error(data.message ?? "Unable to cancel booking");
  }

  return data.booking;
}

export async function createBooking(payload: CreateBookingPayload): Promise<Booking> {
  const response = await authFetch("/booking", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => ({}))) as Partial<BookingResponse> & {
    message?: string;
  };

  if (!response.ok || !data.booking) {
    throw new Error(data.message ?? "Unable to create booking");
  }

  return data.booking;
}

export async function createPayment(payload: CreatePaymentPayload): Promise<Payment> {
  const response = await authFetch("/payment", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => ({}))) as Partial<PaymentResponse> & {
    message?: string;
  };

  if (!response.ok || !data.newPayment) {
    throw new Error(data.message ?? "Unable to create payment");
  }

  return data.newPayment;
}

export async function createPassenger(payload: CreatePassengerPayload): Promise<Passenger> {
  const response = await authFetch("/passenger", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => ({}))) as Partial<PassengerResponse> & {
    message?: string;
  };

  if (!response.ok || !data.passenger) {
    throw new Error(data.message ?? "Unable to save passenger details");
  }

  return data.passenger;
}

export async function getPassengersByBooking(bookingId: number): Promise<Passenger[]> {
  const response = await authFetch(`/passenger/${bookingId}/passengers`);

  const data = (await response.json().catch(() => ({}))) as Partial<PassengersResponse> & {
    message?: string;
  };

  if (!response.ok || !data.passengers) {
    throw new Error(data.message ?? "Unable to load passenger details");
  }

  return data.passengers;
}

export async function updatePassenger(
  passengerId: number,
  payload: UpdatePassengerPayload,
): Promise<Passenger> {
  const response = await authFetch(`/passenger/${passengerId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => ({}))) as Partial<PassengerResponse> & {
    message?: string;
  };

  if (!response.ok || !data.passenger) {
    throw new Error(data.message ?? "Unable to update passenger details");
  }

  return data.passenger;
}
