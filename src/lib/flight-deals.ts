import { searchFlights } from "./search-flight";

export type FlightDeal = {
  toLocation: string;
  price: number;
};

export async function getFlightDeals(fromLocation: string, limit = 6): Promise<FlightDeal[]> {
  const flights = await searchFlights({ fromLocation });
  const cheapestByDestination = new Map<string, number>();

  for (const flight of flights) {
    if (flight.toLocation === fromLocation) continue;

    const price = Number(flight.price);
    if (!Number.isFinite(price)) continue;

    const existing = cheapestByDestination.get(flight.toLocation);
    if (existing === undefined || price < existing) {
      cheapestByDestination.set(flight.toLocation, price);
    }
  }

  return Array.from(cheapestByDestination, ([toLocation, price]) => ({ toLocation, price }))
    .sort((a, b) => a.price - b.price)
    .slice(0, limit);
}

export function formatDealPrice(price: number) {
  return `₱${Math.round(price).toLocaleString("en-PH")}`;
}
