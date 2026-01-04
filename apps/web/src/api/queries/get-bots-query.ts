import { getBotsQueryOptions } from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";

export const getBotsQuery = () => {
  const options = getBotsQueryOptions();

  return {
    ...options,
    useClientQuery: () => useQuery(options),
  };
};
