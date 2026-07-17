import { getAllFlights } from "./search-flight";

export type FlightDeal = {
  fromLocation: string;
  toLocation: string;
  price: number;
};

// Fetches every flight row from the database (GET /api/flight/) and filters
// down to the given origins client-side, so this reflects real DB rows only.
export async function getFlightDeals(locations: string[], limit = 6): Promise<FlightDeal[]> {
  const flights = await getAllFlights();
  const origins = new Set(locations);
  const cheapestByRoute = new Map<string, FlightDeal>();

  for (const flight of flights) {
    if (!origins.has(flight.fromLocation)) continue;
    if (flight.toLocation === flight.fromLocation) continue;

    const price = Number(flight.price);
    if (!Number.isFinite(price)) continue;

    const routeKey = `${flight.fromLocation}->${flight.toLocation}`;
    const existing = cheapestByRoute.get(routeKey);
    if (!existing || price < existing.price) {
      cheapestByRoute.set(routeKey, {
        fromLocation: flight.fromLocation,
        toLocation: flight.toLocation,
        price,
      });
    }
  }

  return Array.from(cheapestByRoute.values())
    .sort((a, b) => a.price - b.price)
    .slice(0, limit);
}

export function formatDealPrice(price: number) {
  return `₱${Math.round(price).toLocaleString("en-PH")}`;
}
