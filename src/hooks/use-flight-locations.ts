import { useEffect, useState } from "react";
import { getFlightLocations } from "@/lib/flight-locations";

export function useFlightLocations() {
  const [locations, setLocations] = useState<string[]>([]);

  useEffect(() => {
    let active = true;

    getFlightLocations()
      .then((result) => {
        if (active) {
          setLocations(result);
        }
      })
      .catch(() => {
        if (active) {
          setLocations([]);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return locations;
}
