import { API_BASE_URL } from "./api-config";

export async function getFlightLocations(): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/flight/locations`, {
    credentials: "include",
  });

  const data = (await response.json().catch(() => ({}))) as {
    message?: string;
    locations?: string[];
  };

  if (!response.ok) {
    throw new Error(data.message ?? "Unable to load flight locations");
  }

  return data.locations ?? [];
}
