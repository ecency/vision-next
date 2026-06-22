export interface GeoCoordinates {
  lat: number;
  lng: number;
}

export interface GeoLocation {
  coordinates: GeoCoordinates;
  address?: string;
}

export interface GeoSuggestion {
  /** Stable key for list rendering. */
  id: string;
  /** Primary, human-readable label (e.g. "Kaunas"). */
  label: string;
  /** Secondary, muted line (e.g. "Kaunas County, Lithuania"). */
  hint?: string;
  lat: number;
  lng: number;
  source: "offline" | "geocoder";
}

/**
 * Compact, code-split cities dataset (GeoNames cities15000) consumed by the
 * offline typeahead. Rows are sorted by population descending, so the array
 * index doubles as a popularity rank.
 */
export interface CitiesDataset {
  v: number;
  fields: string[];
  /** ISO country code -> display name. */
  countries: Record<string, string>;
  /** [name, region, countryCode, lat, lng] */
  cities: [string, string, string, number, number][];
}
