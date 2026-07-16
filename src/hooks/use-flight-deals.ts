import { useEffect, useState } from "react";
import { getFlightDeals, type FlightDeal } from "@/lib/flight-deals";

export function useFlightDeals(fromLocation: string) {
  const [deals, setDeals] = useState<FlightDeal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!fromLocation) {
      setDeals([]);
      setIsLoading(false);
      return;
    }

    let active = true;
    setIsLoading(true);

    getFlightDeals(fromLocation)
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
  }, [fromLocation]);

  return { deals, isLoading };
}
