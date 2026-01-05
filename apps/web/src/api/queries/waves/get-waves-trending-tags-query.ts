import { getWavesTrendingTagsQueryOptions } from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";

export const getWavesTrendingTagsQuery = (host: string, hours = 24) => {
  const options = getWavesTrendingTagsQueryOptions(host, hours);

  return {
    ...options,
    useClientQuery: () => useQuery(options),
  };
};
