import {
  DynamicProps,
  getAccountFullQueryOptions,
  getDynamicPropsQueryOptions,
  getQueryClient,
} from "@ecency/sdk";
import { queryOptions } from "@tanstack/react-query";
import { GeneralAssetInfo } from "../../types";
import { parseAsset, vestsToHp } from "../../utils";
import { FullAccount } from "@ecency/sdk/dist/modules/accounts/types";

function getAPR(dynamicProps: DynamicProps) {
  // The inflation was set to 9.5% at block 7m
  const initialInflationRate = 9.5;
  const initialBlock = 7000000;

  // It decreases by 0.01% every 250k blocks
  const decreaseRate = 250000;
  const decreasePercentPerIncrement = 0.01;

  // How many increments have happened since block 7m?
  const headBlock = dynamicProps.headBlock;
  const deltaBlocks = headBlock - initialBlock;
  const decreaseIncrements = deltaBlocks / decreaseRate;

  // Current inflation rate
  let currentInflationRate =
    initialInflationRate - decreaseIncrements * decreasePercentPerIncrement;

  // Cannot go lower than 0.95%
  if (currentInflationRate < 0.95) {
    currentInflationRate = 0.95;
  }

  // Now lets calculate the "APR"
  const vestingRewardPercent = dynamicProps.vestingRewardPercent / 10000;
  const virtualSupply = dynamicProps.virtualSupply;
  const totalVestingFunds = dynamicProps.totalVestingFund;

  return (
    (virtualSupply * currentInflationRate * vestingRewardPercent) /
    totalVestingFunds
  ).toFixed(3);
}

export function getHivePowerAssetGeneralInfoQueryOptions(username: string) {
  return queryOptions({
    queryKey: ["assets", "hive-power", "general-info", username],
    staleTime: 60000,
    refetchInterval: 90000,
    queryFn: async () => {
      await getQueryClient().prefetchQuery(getDynamicPropsQueryOptions());
      await getQueryClient().prefetchQuery(
        getAccountFullQueryOptions(username)
      );

      const dynamicProps = getQueryClient().getQueryData<DynamicProps>(
        getDynamicPropsQueryOptions().queryKey
      );
      const accountData = getQueryClient().getQueryData<FullAccount>(
        getAccountFullQueryOptions(username).queryKey
      );

      if (!dynamicProps || !accountData) {
        return {
          name: "HP",
          title: "Hive Power",
          price: 0,
          accountBalance: 0,
        };
      }

      // const nextVestingSharesWithdrawal = !isEmptyDate(
      //   accountData.next_vesting_withdrawal
      // )
      //   ? Math.min(
      //       parseAsset(accountData.vesting_withdraw_rate).amount,
      //       (Number(accountData.to_withdraw) - Number(accountData.withdrawn)) /
      //         1e6
      //     )
      //   : 0;

      return {
        name: "HP",
        title: "Hive Power",
        price: dynamicProps ? dynamicProps.base / dynamicProps.quote : 0,
        accountBalance: +vestsToHp(
          parseAsset(accountData.vesting_shares).amount,
          // parseAsset(accountData.delegated_vesting_shares).amount +
          // parseAsset(accountData.received_vesting_shares).amount -
          // nextVestingSharesWithdrawal,
          dynamicProps.hivePerMVests
        ).toFixed(3),
        apr: getAPR(dynamicProps),
        parts: [
          {
            name: "delegating",
            balance: +vestsToHp(
              parseAsset(accountData.delegated_vesting_shares).amount,
              dynamicProps.hivePerMVests
            ).toFixed(3),
          },
          {
            name: "received",
            balance: +vestsToHp(
              parseAsset(accountData.received_vesting_shares).amount,
              dynamicProps.hivePerMVests
            ).toFixed(3),
          },
        ],
      } satisfies GeneralAssetInfo;
    },
  });
}
