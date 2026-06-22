import { CitiesDataset, GeoSuggestion } from "./geo-tag-types";

/** Lowercase + strip diacritics for accent-insensitive matching. */
export function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip combining diacritical marks
    .trim();
}

export interface CityIndex {
  dataset: CitiesDataset;
  /** Normalized city names, aligned by index with dataset.cities. */
  normalized: string[];
}

/**
 * Pre-compute the normalized name for every city once, so each keystroke is a
 * cheap string scan rather than thousands of allocations.
 */
export function buildCityIndex(dataset: CitiesDataset): CityIndex {
  return {
    dataset,
    normalized: dataset.cities.map((c) => normalize(c[0]))
  };
}

function cityToSuggestion(index: CityIndex, i: number): GeoSuggestion {
  const [name, region, cc, lat, lng] = index.dataset.cities[i];
  const country = index.dataset.countries[cc] ?? cc;
  const hint = [region, country].filter(Boolean).join(", ");
  return { id: `c:${i}`, label: name, hint, lat, lng, source: "offline" };
}

/**
 * Instant, offline city search. Prefix matches rank above substring matches,
 * and within each tier the population-sorted dataset order is preserved (most
 * populous first). Stops early once enough prefix matches are found.
 */
export function searchCities(index: CityIndex, query: string, limit = 6): GeoSuggestion[] {
  const q = normalize(query);
  if (q.length < 2) return [];

  const prefix: number[] = [];
  const contains: number[] = [];

  const { normalized } = index;
  for (let i = 0; i < normalized.length; i++) {
    const name = normalized[i];
    if (name.startsWith(q)) {
      prefix.push(i);
      // The dataset is population-sorted, so the first `limit` prefix matches
      // are already the best possible results — no need to scan further.
      if (prefix.length >= limit) break;
    } else if (contains.length < limit && name.includes(q)) {
      contains.push(i);
    }
  }

  return [...prefix, ...contains].slice(0, limit).map((i) => cityToSuggestion(index, i));
}

interface PhotonFeature {
  geometry?: { coordinates?: [number, number] };
  properties?: Record<string, string | number | undefined>;
}

function str(v: string | number | undefined): string {
  return v === undefined || v === null ? "" : String(v);
}

function photonFeatureToSuggestion(feature: PhotonFeature, i: number): GeoSuggestion | null {
  const coords = feature.geometry?.coordinates;
  const p = feature.properties ?? {};
  if (!coords || coords.length < 2) return null;

  const [lng, lat] = coords;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const houseAndStreet = [str(p.street), str(p.housenumber)].filter(Boolean).join(" ");
  const label = str(p.name) || houseAndStreet || str(p.city) || str(p.county) || str(p.state);
  if (!label) return null;

  const hintParts = [
    houseAndStreet && houseAndStreet !== label ? houseAndStreet : "",
    str(p.city) && str(p.city) !== label ? str(p.city) : "",
    str(p.state) && str(p.state) !== label ? str(p.state) : "",
    str(p.country)
  ].filter(Boolean);

  // de-duplicate consecutive identical parts
  const hint = hintParts.filter((part, idx) => part !== hintParts[idx - 1]).join(", ");

  return {
    id: `g:${str(p.osm_id) || `${lat},${lng}`}:${i}`,
    label,
    hint,
    lat,
    lng,
    source: "geocoder"
  };
}

/**
 * Full address / POI search via Photon (open-source geocoder built on
 * OpenStreetMap). Used as the long-tail fallback to the offline cities.
 */
export async function searchGeocoder(
  host: string,
  query: string,
  signal?: AbortSignal,
  limit = 5
): Promise<GeoSuggestion[]> {
  const url = `${host.replace(/\/$/, "")}/api?q=${encodeURIComponent(query)}&limit=${limit}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Geocoder responded with ${res.status}`);

  const json = (await res.json()) as { features?: PhotonFeature[] };
  return (json.features ?? [])
    .map((f, i) => photonFeatureToSuggestion(f, i))
    .filter((s): s is GeoSuggestion => s !== null);
}

/**
 * Reverse geocode a coordinate to a human-readable address (map click / drag /
 * detected location). Returns a coordinate-string fallback when nothing maps.
 */
export async function reverseGeocode(
  host: string,
  lat: number,
  lng: number,
  signal?: AbortSignal
): Promise<string> {
  const fallback = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  try {
    const url = `${host.replace(/\/$/, "")}/reverse?lat=${lat}&lon=${lng}`;
    const res = await fetch(url, { signal });
    if (!res.ok) return fallback;

    const json = (await res.json()) as { features?: PhotonFeature[] };
    const first = json.features?.[0];
    if (!first) return fallback;

    const suggestion = photonFeatureToSuggestion(first, 0);
    if (!suggestion) return fallback;

    return [suggestion.label, suggestion.hint].filter(Boolean).join(", ") || fallback;
  } catch (e) {
    if ((e as Error)?.name === "AbortError") throw e;
    return fallback;
  }
}

/** Merge offline + geocoder results, dropping geocoder rows that duplicate a city. */
export function mergeSuggestions(
  offline: GeoSuggestion[],
  geocoder: GeoSuggestion[],
  limit = 8
): GeoSuggestion[] {
  // City-level key (~1km) used only to drop a geocoder row that restates one of
  // the offline cities. Distinct nearby POIs are kept — they are de-duplicated
  // among themselves by their stable id, not by coarse coordinates.
  const cityKey = (s: GeoSuggestion) =>
    `${normalize(s.label)}|${s.lat.toFixed(2)}|${s.lng.toFixed(2)}`;
  const offlineCities = new Set(offline.map(cityKey));
  const seenIds = new Set(offline.map((s) => s.id));

  const extra = geocoder.filter((s) => {
    if (offlineCities.has(cityKey(s))) return false;
    if (seenIds.has(s.id)) return false;
    seenIds.add(s.id);
    return true;
  });

  return [...offline, ...extra].slice(0, limit);
}
