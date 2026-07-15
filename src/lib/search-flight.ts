import { API_BASE_URL } from "./api-config";

export type SearchFlightParams = {
  fromLocation?: string;
  toLocation?: string;
  departureDate?: string;
  passengers?: number;
};

export type FlightSearchResult = {
  id: number;
  airlineId: number;
  fromLocation: string;
  toLocation: string;
  departureDateTime: string;
  arrivalDateTime: string;
  seatsAvailable: number;
  price: string;
  airline?: {
    id: number;
    name: string;
    logoUrl?: string | null;
    email?: string;
    mobileNumber?: string | null;
    address?: string | null;
  };
};

type SearchFlightResponse = {
  message: string;
  flights: FlightSearchResult[];
};

export async function searchFlights(params: SearchFlightParams) {
  const searchParams = new URLSearchParams();

  if (params.fromLocation?.trim()) {
    searchParams.set("fromLocation", params.fromLocation.trim());
  }

  if (params.toLocation?.trim()) {
    searchParams.set("toLocation", params.toLocation.trim());
  }

  if (params.departureDate) {
    searchParams.set("departureDate", params.departureDate);
  }

  if (params.passengers) {
    searchParams.set("passengers", String(params.passengers));
  }

  const response = await fetch(`${API_BASE_URL}/flight/search?${searchParams.toString()}`, {
    credentials: "include",
  });
  const data = (await response.json().catch(() => ({}))) as Partial<SearchFlightResponse> & {
    message?: string;
  };

  if (!response.ok) {
    throw new Error(data.message ?? "Unable to search flights");
  }

  return data.flights ?? [];
}
