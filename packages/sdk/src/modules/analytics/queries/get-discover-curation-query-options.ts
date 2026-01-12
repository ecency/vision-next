import { queryOptions } from "@tanstack/react-query";
import { CONFIG } from "@/modules/core";
import { CurationDuration, CurationItem } from "../types";

export function getDiscoverCurationQueryOptions(duration: CurationDuration) {
  return queryOptions({
    queryKey: ["analytics", "discover-curation", duration],
    queryFn: async ({ signal }) => {
      const response = await fetch(
        CONFIG.privateApiHost + `/private-api/curation/${duration}`,
        { signal }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch curation data: ${response.status}`);
      }

      const data = (await response.json()) as CurationItem[];

      // Fetch account data for efficiency calculation
      const accounts = data.map((item) => item.account);
      const accountsResponse = await CONFIG.hiveClient.database.getAccounts(accounts);

      // Calculate efficiency for each curator
      for (let index = 0; index < accountsResponse.length; index++) {
        const element = accountsResponse[index];
        const curator = data[index];

        // Convert Asset to string if needed
        const vestingShares = typeof element.vesting_shares === 'string'
          ? element.vesting_shares
          : element.vesting_shares.toString();
        const receivedVestingShares = typeof element.received_vesting_shares === 'string'
          ? element.received_vesting_shares
          : element.received_vesting_shares.toString();
        const delegatedVestingShares = typeof element.delegated_vesting_shares === 'string'
          ? element.delegated_vesting_shares
          : element.delegated_vesting_shares.toString();
        const vestingWithdrawRate = typeof element.vesting_withdraw_rate === 'string'
          ? element.vesting_withdraw_rate
          : element.vesting_withdraw_rate.toString();

        const effectiveVest: number =
          parseFloat(vestingShares) +
          parseFloat(receivedVestingShares) -
          parseFloat(delegatedVestingShares) -
          parseFloat(vestingWithdrawRate);
        curator.efficiency = curator.vests / effectiveVest;
      }

      // Sort by efficiency descending
      data.sort((a: CurationItem, b: CurationItem) => b.efficiency - a.efficiency);

      return data;
    },
  });
}
