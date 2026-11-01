import { z } from "zod";

/** Open-Meteo (free, no key): humidity, temperature, UV and air quality at the scan location. */
const Forecast = z.object({ current: z.object({ temperature_2m: z.number(), relative_humidity_2m: z.number(), uv_index: z.number().optional() }) });
const Air = z.object({ current: z.object({ us_aqi: z.number().nullable() }) });

export interface LocalContext {
  humidity: number;
  tempC: number;
  uvIndex?: number;
  aqi?: number;
}

export function parseLocalContext(forecast: unknown, air: unknown): LocalContext | null {
  const f = Forecast.safeParse(forecast);
  if (!f.success) return null;
  const a = Air.safeParse(air);
  const c = f.data.current;
  return { humidity: Math.round(c.relative_humidity_2m), tempC: Math.round(c.temperature_2m), uvIndex: c.uv_index, aqi: a.success && a.data.current.us_aqi !== null ? Math.round(a.data.current.us_aqi) : undefined };
}

/** Coordinates are rounded to ~10 km before leaving the device and are never stored. */
export const roundCoord = (v: number) => Math.round(v * 10) / 10;

export async function fetchLocalContext(lat: number, lon: number): Promise<LocalContext | null> {
  const q = `latitude=${roundCoord(lat)}&longitude=${roundCoord(lon)}`;
  try {
    const [f, a] = await Promise.all([
      fetch(`https://api.open-meteo.com/v1/forecast?${q}&current=temperature_2m,relative_humidity_2m,uv_index`, { signal: AbortSignal.timeout(8000) }).then((r) => r.json()),
      fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?${q}&current=us_aqi`, { signal: AbortSignal.timeout(8000) }).then((r) => r.json()),
    ]);
    return parseLocalContext(f, a);
  } catch {
    return null;
  }
}

/** Ask for location once per check-in; denial or failure just means no auto context. */
export function currentPosition(): Promise<GeolocationPosition | null> {
  return new Promise((resolve) => {
    if (!("geolocation" in navigator)) return resolve(null);
    navigator.geolocation.getCurrentPosition(resolve, () => resolve(null), { maximumAge: 3_600_000, timeout: 8000 });
  });
}
