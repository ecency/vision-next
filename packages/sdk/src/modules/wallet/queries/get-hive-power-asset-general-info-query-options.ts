import { CONFIG } from "@/modules/core/config";
import type { DynamicProps } from "@/modules/core";
import { getAccountFullQueryOptions } from "@/modules/accounts";
import { getDynamicPropsQueryOptions, getQueryClient } from "@/modules/core";
import type { FullAccount } from "@/modules/accounts";
import { queryOptions } from "@tanstack/react-query";
import type { GeneralAssetInfo } from "../types";
import { isEmptyDate, parseAsset, vestsToHp } from "@/modules/core/utils";

function getAPR(dynamicProps: DynamicProps) {
  const initialInflationRate = 9.5;
  const initialBlock = 7000000;
  const decreaseRate = 250000;
  const decreasePercentPerIncrement = 0.01;

  const headBlock = dynamicProps.headBlock;
  const deltaBlocks = headBlock - initialBlock;
  const decreaseIncrements = deltaBlocks / decreaseRate;

  let currentInflationRate =
    initialInflationRate - decreaseIncrements * decreasePercentPerIncrement;

  if (currentInflationRate < 0.95) {
    currentInflationRate = 0.95;
  }

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

      const marketTicker = (await CONFIG.hiveClient
        .call("condenser_api", "get_ticker", [])
        .catch(() => undefined)) as { latest?: string } | undefined;

      const marketPrice = Number.parseFloat(marketTicker?.latest ?? "");
      const price = Number.isFinite(marketPrice)
        ? marketPrice
        : dynamicProps.base / dynamicProps.quote;

      const vestingShares = parseAsset(accountData.vesting_shares).amount;
      const delegatedVests = parseAsset(
        accountData.delegated_vesting_shares
      ).amount;
      const receivedVests = parseAsset(
        accountData.received_vesting_shares
      ).amount;
      const withdrawRateVests = parseAsset(
        accountData.vesting_withdraw_rate
      ).amount;
      const remainingToWithdrawVests = Math.max(
        (Number(accountData.to_withdraw) - Number(accountData.withdrawn)) /
          1e6,
        0
      );
      const nextWithdrawalVests = !isEmptyDate(
        accountData.next_vesting_withdrawal
      )
        ? Math.min(withdrawRateVests, remainingToWithdrawVests)
        : 0;

      const hpBalance = +vestsToHp(
        vestingShares,
        dynamicProps.hivePerMVests
      ).toFixed(3);
      const outgoingDelegationsHp = +vestsToHp(
        delegatedVests,
        dynamicProps.hivePerMVests
      ).toFixed(3);
      const incomingDelegationsHp = +vestsToHp(
        receivedVests,
        dynamicProps.hivePerMVests
      ).toFixed(3);
      const pendingPowerDownHp = +vestsToHp(
        remainingToWithdrawVests,
        dynamicProps.hivePerMVests
      ).toFixed(3);
      const nextPowerDownHp = +vestsToHp(
        nextWithdrawalVests,
        dynamicProps.hivePerMVests
      ).toFixed(3);
      const totalBalance = Math.max(hpBalance - pendingPowerDownHp, 0);
      const availableHp = Math.max(hpBalance - outgoingDelegationsHp, 0);

      return {
        name: "HP",
        title: "Hive Power",
        price,
        accountBalance: +totalBalance.toFixed(3),
        apr: getAPR(dynamicProps),
        parts: [
          {
            name: "hp_balance",
            balance: hpBalance,
          },
          {
            name: "available",
            balance: +availableHp.toFixed(3),
          },
          {
            name: "outgoing_delegations",
            balance: outgoingDelegationsHp,
          },
          {
            name: "incoming_delegations",
            balance: incomingDelegationsHp,
          },
          ...(pendingPowerDownHp > 0
            ? [
                {
                  name: "pending_power_down",
                  balance: +pendingPowerDownHp.toFixed(3),
                },
              ]
            : []),
          ...(nextPowerDownHp > 0 && nextPowerDownHp !== pendingPowerDownHp
            ? [
                {
                  name: "next_power_down",
                  balance: +nextPowerDownHp.toFixed(3),
                },
              ]
            : []),
        ],
      } satisfies GeneralAssetInfo;
    },
  });
}
