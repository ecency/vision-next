import { describe, expect, it, vi, afterEach } from "vitest";
import {
  buildCityIndex,
  mergeSuggestions,
  normalize,
  reverseGeocode,
  searchCities,
  searchGeocoder
} from "@/app/publish/_components/publish-editor-geo-tag/geo-search";
import { CitiesDataset, GeoSuggestion } from "@/app/publish/_components/publish-editor-geo-tag/geo-tag-types";

const dataset: CitiesDataset = {
  v: 1,
  fields: ["name", "region", "cc", "lat", "lng"],
  countries: { LT: "Lithuania", DE: "Germany", US: "United States" },
  // intentionally out of population order to prove the index preserves array order
  cities: [
    ["Kansas City", "Missouri", "US", 39.0997, -94.5786],
    ["Kaunas", "Kaunas County", "LT", 54.9027, 23.9096],
    ["Köln", "North Rhine-Westphalia", "DE", 50.9333, 6.95],
    ["Kaiserslautern", "Rhineland-Palatinate", "DE", 49.4438, 7.7689]
  ]
};

describe("normalize", () => {
  it("lowercases, trims and strips diacritics", () => {
    expect(normalize("  Köln ")).toBe("koln");
    expect(normalize("São Paulo")).toBe("sao paulo");
    expect(normalize("KAUNAS")).toBe("kaunas");
  });
});

describe("searchCities", () => {
  const index = buildCityIndex(dataset);

  it("returns nothing for queries shorter than 2 chars", () => {
    expect(searchCities(index, "k")).toEqual([]);
    expect(searchCities(index, "")).toEqual([]);
  });

  it("ranks prefix matches and preserves dataset (popularity) order within a tier", () => {
    const res = searchCities(index, "ka");
    expect(res.map((r) => r.label)).toEqual(["Kansas City", "Kaunas", "Kaiserslautern"]);
  });

  it("matches accent-insensitively", () => {
    const res = searchCities(index, "koln");
    expect(res[0]?.label).toBe("Köln");
    expect(res[0]?.source).toBe("offline");
  });

  it("builds a label/hint from region + country name", () => {
    const [first] = searchCities(index, "kaunas");
    expect(first.label).toBe("Kaunas");
    expect(first.hint).toBe("Kaunas County, Lithuania");
    expect(first).toMatchObject({ lat: 54.9027, lng: 23.9096 });
  });

  it("respects the limit", () => {
    expect(searchCities(index, "ka", 2)).toHaveLength(2);
  });
});

describe("mergeSuggestions", () => {
  const offline: GeoSuggestion[] = [
    { id: "c:1", label: "Kaunas", hint: "Lithuania", lat: 54.9027, lng: 23.9096, source: "offline" }
  ];

  it("drops geocoder rows that duplicate an offline city by name + rounded coords", () => {
    const geocoder: GeoSuggestion[] = [
      { id: "g:1", label: "Kaunas", hint: "LT", lat: 54.9031, lng: 23.9099, source: "geocoder" },
      { id: "g:2", label: "Kaunas Castle", hint: "LT", lat: 54.8, lng: 23.88, source: "geocoder" }
    ];
    const merged = mergeSuggestions(offline, geocoder);
    expect(merged.map((m) => m.label)).toEqual(["Kaunas", "Kaunas Castle"]);
  });

  it("caps the merged list at the limit", () => {
    const many: GeoSuggestion[] = Array.from({ length: 10 }, (_, i) => ({
      id: `g:${i}`,
      label: `Place ${i}`,
      lat: i,
      lng: i,
      source: "geocoder" as const
    }));
    expect(mergeSuggestions(offline, many, 5)).toHaveLength(5);
  });
});

describe("searchGeocoder", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("maps Photon GeoJSON features (lng,lat order) to suggestions", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          features: [
            {
              geometry: { coordinates: [23.9096, 54.9027] },
              properties: { name: "Kaunas", state: "Kaunas County", country: "Lithuania", osm_id: 42 }
            }
          ]
        })
      }))
    );

    const res = await searchGeocoder("https://photon.test", "kaunas");
    expect(res).toHaveLength(1);
    expect(res[0]).toMatchObject({
      label: "Kaunas",
      hint: "Kaunas County, Lithuania",
      lat: 54.9027,
      lng: 23.9096,
      source: "geocoder"
    });
  });

  it("throws on non-ok responses so the caller can fall back to offline", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 500 })));
    await expect(searchGeocoder("https://photon.test", "x")).rejects.toThrow();
  });
});

describe("reverseGeocode", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("returns a formatted address for the nearest feature", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          features: [
            {
              geometry: { coordinates: [23.9096, 54.9027] },
              properties: { name: "Kaunas", country: "Lithuania" }
            }
          ]
        })
      }))
    );
    expect(await reverseGeocode("https://photon.test", 54.9027, 23.9096)).toBe(
      "Kaunas, Lithuania"
    );
  });

  it("falls back to a coordinate string when the request fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 503 })));
    expect(await reverseGeocode("https://photon.test", 54.90273, 23.90961)).toBe(
      "54.90273, 23.90961"
    );
  });
});
