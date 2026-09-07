// Shared reverse/forward geocoding against the free Nominatim (OpenStreetMap)
// API — used by the Prayer Times location picker. No API key, no server
// round-trip; runs entirely in the visitor's own browser.

export interface StoredLocation {
  latitude: number;
  longitude: number;
  name: string;
}

/** "23.81, 90.41" — the fallback name saved when reverse geocoding fails.
 * Used to detect an already-saved location that never got a real city name,
 * so it can be silently re-resolved later instead of staying stuck forever. */
const RAW_COORD_NAME_RE = /^-?\d{1,3}\.\d{1,4}, ?-?\d{1,3}\.\d{1,4}$/;
export function looksLikeRawCoordinates(name: string): boolean {
  return RAW_COORD_NAME_RE.test(name.trim());
}

/** Reverse-geocodes lat/lon into a short "City, Country" name. Retries once
 * after a short delay (Nominatim occasionally rate-limits or blips) before
 * giving up and returning null — callers fall back to raw coordinates. */
export async function reverseGeocodeCity(lat: number, lon: number): Promise<string | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
        { headers: { Accept: 'application/json' } }
      );
      if (!r.ok) throw new Error(String(r.status));
      const d = (await r.json()) as {
        address?: { city?: string; town?: string; village?: string; country?: string };
      };
      const city = d.address?.city ?? d.address?.town ?? d.address?.village;
      const country = d.address?.country;
      if (city || country) return [city, country].filter(Boolean).join(', ');
      return null;
    } catch {
      if (attempt === 0) await new Promise((res) => setTimeout(res, 800));
    }
  }
  return null;
}
