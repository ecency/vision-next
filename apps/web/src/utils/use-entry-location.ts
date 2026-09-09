import { Entry } from "@/entities";
import { useMemo } from "react";
import { parseEntryLocationFromBody } from "@/core/entries/entry-location";

export function useEntryLocation(entry?: Entry) {
  return useMemo(() => {
    // Feed rows carry this in metadata (the slim step lifts it there before the
    // body goes); a full entry still gets it parsed out of the body.
    // Only the body-parsed path validates its numbers; metadata is untrusted
    // and its address is rendered as a React child, so check the shape here.
    const metadataLocation = entry?.json_metadata?.location;
    if (
      metadataLocation &&
      Number.isFinite(metadataLocation.coordinates?.lat) &&
      Number.isFinite(metadataLocation.coordinates?.lng) &&
      (metadataLocation.address === undefined || typeof metadataLocation.address === "string")
    ) {
      return metadataLocation;
    }

    return parseEntryLocationFromBody(entry?.body);
  }, [entry]);
}
