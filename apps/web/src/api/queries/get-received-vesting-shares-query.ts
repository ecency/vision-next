import { getReceivedVestingSharesQueryOptions, ReceivedVestingShare } from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";
import { parseAsset } from "@/utils";

export type { ReceivedVestingShare };

export const getReceivedVestingSharesQuery = (username: string) => {
  const options = {
    ...getReceivedVestingSharesQueryOptions(username),
    select: (data: ReceivedVestingShare[]) =>
      data.sort((a, b) => parseAsset(b.vesting_shares).amount - parseAsset(a.vesting_shares).amount),
  };

  return {
    ...options,
    useClientQuery: () => useQuery(options),
  };
};
