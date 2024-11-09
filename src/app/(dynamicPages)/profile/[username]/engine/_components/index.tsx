"use client";
import React, { useMemo, useState } from "react";
import "./_index.scss";

import { claimRewards, getUnclaimedRewards } from "@/api/hive-engine";

import { plusCircle } from "@/assets/img/svg";
import { Popover, PopoverContent } from "@ui/popover";
import { error, LinearProgress, success, TransferAsset, TransferMode } from "@/features/shared";
import i18next from "i18next";
import { formattedNumber } from "@/utils";
import { SortEngineTokens } from "./sort-hive-engine-tokens";
import { EngineTokensEstimated } from "./engine-tokens-estimated";
import { Account, TokenStatus } from "@/entities";
import { useGlobalStore } from "@/core/global-store";
import { useGetHiveEngineBalancesQuery } from "@/api/queries";
import { formatError } from "@/api/operations";
import useMount from "react-use/lib/useMount";
import { WalletMenu } from "../../_components/wallet-menu";
import { WalletEngineTokenItem } from "@/app/(dynamicPages)/profile/[username]/engine/_components/wallet-engine-token-item";
import { EngineTransfer } from "@/app/(dynamicPages)/profile/[username]/engine/_components/engine-transfer";

interface Props {
  account: Account;
}

export function WalletHiveEngine({ account }: Props) {
  const activeUser = useGlobalStore((s) => s.activeUser);

  const [rewards, setRewards] = useState<TokenStatus[]>([]);
  const [claiming, setClaiming] = useState(false);
  const [transfer, setTransfer] = useState(false);
  const [transferMode, setTransferMode] = useState<TransferMode>();
  const [transferAsset, setTransferAsset] = useState<TransferAsset>();
  const [currentSort, setCurrentSort] = useState<
    "delegationIn" | "asc" | "desc" | "balance" | "stake" | "delegationOut" | "usdValue"
  >();

  const { data: balancesData, isFetching } = useGetHiveEngineBalancesQuery(account.name);

  const tokens = useMemo(
    () =>
      (balancesData ?? [])
        .sort((a, b) => {
          if (a.balance !== b.balance) {
            return a.balance < b.balance ? 1 : -1;
          }

          if (a.stake !== b.stake) {
            return a.stake < b.stake ? 1 : -1;
          }

          return a.symbol > b.symbol ? 1 : -1;
        })
        .sort((a, b) => {
          if (currentSort === "delegationIn") {
            if (b.delegationsIn < a.delegationsIn) return -1;
            if (b.delegationsIn > a.delegationsIn) return 1;
            return 0;
          } else if (currentSort === "asc") {
            if (a.symbol > b.symbol) return 1;
            if (a.symbol < b.symbol) return -1;
            return 0;
          } else if (currentSort === "desc") {
            if (b.symbol < a.symbol) return -1;
            if (b.symbol > a.symbol) return 1;
            return 0;
          } else if (currentSort === "balance") {
            if (b.balance < a.balance) return -1;
            if (b.balance > a.balance) return 1;
            return 0;
          } else if (currentSort === "stake") {
            if (b.stake < a.stake) return -1;
            if (b.stake > a.stake) return 1;
            return 0;
          } else if (currentSort === "delegationOut") {
            if (b.delegationsOut < a.delegationsOut) return -1;
            if (b.delegationsOut > a.delegationsOut) return 1;
            return 0;
          } else if (currentSort === "usdValue") {
            if (b.usdValue < a.usdValue) return -1;
            if (b.usdValue > a.usdValue) return 1;
            return 0;
          }
          return 0;
        }),
    [balancesData, currentSort]
  );

  useMount(() => {
    fetchUnclaimedRewards();
  });
  const openTransferDialog = (mode: TransferMode, asset: string, balance: number) => {
    setTransfer(true);
    setTransferMode(mode);
    setTransferAsset(asset as TransferAsset);
  };
  const closeTransferDialog = () => {
    setTransfer(false);
    setTransferMode(undefined);
    setTransferAsset(undefined);
  };
  const claimRewardsAct = (tokens: TokenStatus[]) => {
    if (claiming || !activeUser) {
      return;
    }

    setClaiming(true);

    return claimRewards(
      activeUser.username,
      tokens.map((t) => t.symbol)
    )
      .then((account) => {
        success(i18next.t("wallet.claim-reward-balance-ok"));
      })
      .then(() => setRewards([]))
      .catch((err) => error(...formatError(err)))
      .finally(() => setClaiming(false));
  };
  const fetchUnclaimedRewards = async () => {
    try {
      const rewards = await getUnclaimedRewards(account.name);
      setRewards(rewards);
    } catch (e) {}
  };

  const hasUnclaimedRewards = rewards.length > 0;
  const hasMultipleUnclaimedRewards = rewards.length > 1;
  const isMyPage = activeUser && activeUser.username === account.name;
  let rewardsToShowInTooltip = [...rewards];
  rewardsToShowInTooltip = rewardsToShowInTooltip.splice(0, 10);

  return (
    <div className="wallet-hive-engine">
      <div className="wallet-main">
        <div className="wallet-info">
          {hasUnclaimedRewards && (
            <div className="unclaimed-rewards">
              <div className="title">{i18next.t("wallet.unclaimed-rewards")}</div>

              {hasMultipleUnclaimedRewards ? (
                <div className="rewards">
                  <span className="reward-type">
                    <Popover>
                      <PopoverContent>
                        <div className="tooltip-inner rewards-container">
                          {rewardsToShowInTooltip.map((reward, ind) => (
                            <div
                              className="flex py-1 border-b border-[--border-color]"
                              key={reward.pending_token + ind}
                            >
                              <div className="mr-1 lowercase">{reward.symbol}:</div>
                              <div>{reward.pending_token / Math.pow(10, reward.precision)}</div>
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                    <div className="flex items-center">{`${rewards.length} tokens`}</div>
                  </span>
                  {isMyPage && (
                    <a
                      className={`claim-btn ${claiming ? "in-progress" : ""}`}
                      onClick={() => claimRewardsAct(rewards)}
                    >
                      {plusCircle}
                    </a>
                  )}
                </div>
              ) : (
                rewards.map((r, i) => {
                  const reward = r.pending_token / Math.pow(10, r.precision);

                  return (
                    <div className="rewards" key={i}>
                      <span className="reward-type">
                        {reward < 0.0001
                          ? `${reward} ${r.symbol}`
                          : formattedNumber(reward, {
                              fractionDigits: r.precision,
                              suffix: r.symbol
                            })}
                      </span>
                      {isMyPage && (
                        <a
                          className={`claim-btn ${claiming ? "in-progress" : ""}`}
                          onClick={() => claimRewardsAct([r])}
                        >
                          {plusCircle}
                        </a>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          <div className="balance-row alternative">
            <div className="balance-info">
              <div className="title">{i18next.t("wallet-engine.title")}</div>
              <div className="description">{i18next.t("wallet-engine.description")}</div>
            </div>
          </div>

          <EngineTokensEstimated tokens={balancesData ?? []} />

          {tokens.length >= 3 && (
            <div className="wallet-info">
              <SortEngineTokens
                sortTokensInAscending={() => setCurrentSort("asc")}
                sortTokensInDescending={() => setCurrentSort("desc")}
                sortTokensbyValue={() => setCurrentSort("usdValue")}
                sortTokensbyStake={() => setCurrentSort("stake")}
                sortTokensbyBalance={() => setCurrentSort("balance")}
                sortByDelegationIn={() => setCurrentSort("delegationIn")}
                sortByDelegationOut={() => setCurrentSort("delegationOut")}
              />
            </div>
          )}

          <div className="entry-list">
            {isFetching ? (
              <div className="dialog-placeholder">
                <LinearProgress />
              </div>
            ) : tokens.length === 0 ? (
              <div className="no-results">{i18next.t("wallet-engine.no-results")}</div>
            ) : (
              <div className="flex flex-col gap-4 xl:gap-6">
                {tokens.map((token, i) => (
                  <WalletEngineTokenItem
                    i={i}
                    account={account}
                    openTransferDialog={openTransferDialog}
                    token={token}
                    key={i}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
        <WalletMenu username={account.name} active="engine" />
      </div>
      {transfer && (
        <EngineTransfer
          to={isMyPage ? undefined : account.name}
          mode={transferMode!}
          asset={transferAsset!}
          onHide={closeTransferDialog}
        />
      )}
    </div>
  );
}
