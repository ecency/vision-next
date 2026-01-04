import { getDiscoverCurationQueryOptions, CurationDuration, CurationItem } from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";

export type { CurationDuration, CurationItem };

export const getDiscoverCurationQuery = (duration: CurationDuration) => {
  const options = getDiscoverCurationQueryOptions(duration);

  return {
    ...options,
    useClientQuery: () => useQuery(options),
  };
};
