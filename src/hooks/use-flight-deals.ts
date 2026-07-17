import { useEffect, useState } from "react";
import { getFlightDeals, type FlightDeal } from "@/lib/flight-deals";

export function useFlightDeals(locations: string[]) {
  const [deals, setDeals] = useState<FlightDeal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const locationsKey = locations.join(",");

  useEffect(() => {
    if (locations.length === 0) {
      setDeals([]);
      setIsLoading(false);
      return;
    }

    let active = true;
    setIsLoading(true);

    getFlightDeals(locations)
      .then((result) => {
        if (active) setDeals(result);
      })
      .catch(() => {
        if (active) setDeals([]);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationsKey]);

  return { deals, isLoading };
}
