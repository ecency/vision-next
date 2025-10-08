import { getAccountFullQueryOptions, useBroadcastMutation } from "@ecency/sdk";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getHivePowerAssetGeneralInfoQueryOptions } from "../queries";
import { delay } from "@/modules/wallets/utils";

export function useClaimRewards(
  username: string,
  onSuccess: () => void
): ReturnType<typeof useBroadcastMutation<void>> {
  const { data } = useQuery(getAccountFullQueryOptions(username));

  const queryClient = useQueryClient();

  return useBroadcastMutation<void>(
    ["assets", "hive", "claim-rewards", data?.name],
    username,
    () => {
      if (!data) {
        throw new Error("Failed to fetch account while claiming balance");
      }

      const {
        reward_hive_balance: hiveBalance,
        reward_hbd_balance: hbdBalance,
        reward_vesting_balance: vestingBalance,
      } = data;

      return [
        [
          "claim_reward_balance",
          {
            account: username,
            reward_hive: hiveBalance,
            reward_hbd: hbdBalance,
            reward_vests: vestingBalance,
          },
        ],
      ];
    },
    async () => {
      onSuccess();

      // Some time to think for blockchain
      await delay(1000);

      queryClient.invalidateQueries({
        queryKey: getAccountFullQueryOptions(username).queryKey,
      });
      queryClient.invalidateQueries({
        queryKey: getHivePowerAssetGeneralInfoQueryOptions(username).queryKey,
      });
    }
  );
}
