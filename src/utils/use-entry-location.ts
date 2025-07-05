import { Entry } from "@/entities";
import { useMemo } from "react";

export function useEntryLocation(entry?: Entry) {
  return useMemo(() => {
    const metadataLocation = entry?.json_metadata?.location;
    if (metadataLocation) return metadataLocation;

    if (!entry?.body) return undefined;

    const match = entry.body.match(
        /\[\/\/\]:#\s\(\!(?:worldmappin|pinmapple)\s+([-\d.]+)\s+lat\s+([-\d.]+)\s+long(?:\s+(.*?))?(?:\s+d3scr)?\)/i
    );

    if (match) {
      const [, lat, lng, address] = match;

      const cleanedAddress = address?.trim();

      const fallbackAddress =
          !cleanedAddress ||
          cleanedAddress === "<DESCRIPTION GOES HERE>" ||
          cleanedAddress === "d3scr"
              ? `${lat}, ${lng}`
              : cleanedAddress;

      return {
        coordinates: {
          lat,
          lng,
        },
        address: fallbackAddress,
      };
    }

    return undefined;
  }, [entry]);
}


