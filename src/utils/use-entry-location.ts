import { Entry } from "@/entities";
import { useMemo } from "react";

export function useEntryLocation(entry?: Entry) {
  const metadataLocation = useMemo(() => entry?.json_metadata?.location, [entry]);
  const bodyLocation = useMemo(() => {
    const worldMapPinMention = entry?.body.match(
      /\[\/\/\]:#\s\(\!worldmappin\s(.+)lat\s(.+)long\s(.+)/gim
    );
    if (worldMapPinMention?.[0]) {
      const pureLocation = worldMapPinMention[0].replace("[//]:# (!worldmappin ", "");
      const [lat, _] = pureLocation.split("lat");
      const [lng, __] = _.split("long");
      return {
        coordinates: {
          lat,
          lng
        },
        address: __.slice(0, __.length - 1)
      };
    }
    return "";
  }, [entry]);

  return bodyLocation ?? metadataLocation;
}
