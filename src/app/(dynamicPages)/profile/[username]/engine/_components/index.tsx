"use client";
import React, { useState } from "react";
import "./_index.scss";

import {
  claimRewards,
  getHiveEngineTokenBalances,
  getMetrics,
  getUnclaimedRewards
} from "@/api/hive-engine";

import { plusCircle } from "@/assets/img/svg";
import { Popover, PopoverContent } from "@ui/popover";
import {
  error,
  LinearProgress,
  success,
  Transfer,
  TransferAsset,
  TransferMode
} from "@/features/shared";
import i18next from "i18next";
import { formattedNumber, HiveEngineToken } from "@/utils";
import { SortEngineTokens } from "./sort-hive-engine-tokens";
import { EngineTokensEstimated } from "./engine-tokens-estimated";
import { Account, TokenStatus } from "@/entities";
import { useGlobalStore } from "@/core/global-store";
import { DEFAULT_DYNAMIC_PROPS, getDynamicPropsQuery } from "@/api/queries";
import { formatError } from "@/api/operations";
import useMount from "react-use/lib/useMount";
import { WalletMenu } from "../../_components/wallet-menu";
import { WalletEngineTokenItem } from "@/app/(dynamicPages)/profile/[username]/engine/_components/wallet-engine-token-item";

interface Props {
  account: Account;
}

export function WalletHiveEngine({ account }: Props) {
  const activeUser = useGlobalStore((s) => s.activeUser);
  const canUseWebp = useGlobalStore((s) => s.canUseWebp);
  const isMobile = useGlobalStore((s) => s.isMobile);

  const [tokens, setTokens] = useState<HiveEngineToken[]>([]);
  const [utokens, setUtokens] = useState<HiveEngineToken[]>([]);
  const [rewards, setRewards] = useState<TokenStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [transfer, setTransfer] = useState(false);
  const [transferMode, setTransferMode] = useState<TransferMode>();
  const [transferAsset, setTransferAsset] = useState<TransferAsset>();
  const [assetBalance, setAssetBalance] = useState(0);
  const [allTokens, setAllTokens] = useState<any>();

  const { data: dynamicProps } = getDynamicPropsQuery().useClientQuery();

  useMount(() => {
    fetch();
    fetchUnclaimedRewards();
    priceChangePercent();
  });

  const sortByDelegationIn = () => {
    const byDelegationsIn = tokens.sort((a: any, b: any) => {
      if (b.delegationsIn < a.delegationsIn) return -1;
      if (b.delegationsIn > a.delegationsIn) return 1;
      return 0;
    });

    setTokens(byDelegationsIn);
  };
  const sortTokensInAscending: any = () => {
    const inAscending = tokens.sort((a: any, b: any) => {
      if (a.symbol > b.symbol) return 1;
      if (a.symbol < b.symbol) return -1;
      return 0;
    });

    setTokens(inAscending);
  };
  const sortTokensInDescending: any = () => {
    const inDescending = tokens.sort((a: any, b: any) => {
      if (b.symbol < a.symbol) return -1;
      if (b.symbol > a.symbol) return 1;
      return 0;
    });

    setTokens(inDescending);
  };
  const sortTokensbyValue = async () => {
    const allUserTokens = await tokenUsdValue();
    const tokensInWallet = allUserTokens.filter(
      (a: any) => a.balance !== 0 || a.stakedBalance !== 0
    );
    const byValue = tokensInWallet.sort((a: any, b: any) => {
      if (b.usd_value < a.usd_value) return -1;
      if (b.usd_value > a.usd_value) return 1;
      return 0;
    });
    setTokens(byValue);
  };
  const sortTokensbyBalance = () => {
    const byBalance = tokens.sort((a: any, b: any) => {
      if (b.balance < a.balance) return -1;
      if (b.balance > a.balance) return 1;
      return 0;
    });

    setTokens(byBalance);
  };
  const sortTokensbyStake = () => {
    const byStake = tokens.sort((a: any, b: any) => {
      if (b.stake < a.stake) return -1;
      if (b.stake > a.stake) return 1;
      return 0;
    });

    setTokens(byStake);
  };
  const sortByDelegationOut = () => {
    const byDelegationsOut = tokens.sort((a: any, b: any) => {
      if (b.delegationsOut < a.delegationsOut) return -1;
      if (b.delegationsOut > a.delegationsOut) return 1;
      return 0;
    });

    setTokens(byDelegationsOut);
  };
  const tokenUsdValue = async () => {
    const userTokens: any = await getHiveEngineTokenBalances(account.name);
    const pricePerHive =
      (dynamicProps ?? DEFAULT_DYNAMIC_PROPS).base / (dynamicProps ?? DEFAULT_DYNAMIC_PROPS).quote;

    let balanceMetrics: any = userTokens.map((item: any) => {
      let eachMetric = allTokens.find((m: any) => m.symbol === item.symbol);
      return {
        ...item,
        ...eachMetric
      };
    });
    return balanceMetrics.map((w: any) => {
      const usd_value =
        w.symbol === "SWAP.HIVE"
          ? Number(pricePerHive * w.balance)
          : w.lastPrice === 0
            ? 0
            : Number(w.lastPrice * pricePerHive * w.balance).toFixed(10);
      return {
        ...w,
        usd_value
      };
    });
  };
  const priceChangePercent = async () => {
    const allMarketTokens = await getMetrics();
    setAllTokens(allMarketTokens);
  };
  const openTransferDialog = (mode: TransferMode, asset: string, balance: number) => {
    setTransfer(true);
    setTransferMode(mode);
    setTransferAsset(asset as TransferAsset);
    setAssetBalance(balance);
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
  const fetch = async () => {
    setLoading(true);
    let items;
    try {
      items = await getHiveEngineTokenBalances(account.name);
      setUtokens(items);
      items = items.filter((token) => token.balance !== 0 || token.stakedBalance !== 0);
      items = sort(items);
      setTokens(items);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };
  const fetchUnclaimedRewards = async () => {
    try {
      const rewards = await getUnclaimedRewards(account.name);
      setRewards(rewards);
    } catch (e) {}
  };
  const sort = (items: HiveEngineToken[]) =>
    items.sort((a: HiveEngineToken, b: HiveEngineToken) => {
      if (a.balance !== b.balance) {
        return a.balance < b.balance ? 1 : -1;
      }

      if (a.stake !== b.stake) {
        return a.stake < b.stake ? 1 : -1;
      }

      return a.symbol > b.symbol ? 1 : -1;
    });

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

          <EngineTokensEstimated tokens={utokens} />

          {tokens.length >= 3 && (
            <div className="wallet-info">
              <SortEngineTokens
                sortTokensInAscending={sortTokensInAscending}
                sortTokensInDescending={sortTokensInDescending}
                sortTokensbyValue={sortTokensbyValue}
                sortTokensbyStake={sortTokensbyStake}
                sortTokensbyBalance={sortTokensbyBalance}
                sortByDelegationIn={sortByDelegationIn}
                sortByDelegationOut={sortByDelegationOut}
              />
            </div>
          )}

          <div className="entry-list">
            {loading ? (
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
        <Transfer
          to={isMyPage ? undefined : account.name}
          mode={transferMode!}
          asset={transferAsset!}
          onHide={closeTransferDialog}
        />
      )}
    </div>
  );
}
