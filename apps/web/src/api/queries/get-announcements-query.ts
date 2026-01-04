import { getAnnouncementsQueryOptions } from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";

export const getAnnouncementsQuery = () => {
  const options = getAnnouncementsQueryOptions();

  return {
    ...options,
    useClientQuery: () => useQuery(options),
  };
};
