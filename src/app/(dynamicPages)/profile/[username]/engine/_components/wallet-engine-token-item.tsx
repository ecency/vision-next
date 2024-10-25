import Image from "next/image";
import { HiveEngineChart } from "@/app/(dynamicPages)/profile/[username]/engine/_components/hive-engine-chart";
import { Popover } from "@ui/popover";
import i18next from "i18next";
import {
  delegateOutlineSvg,
  lockOutlineSvg,
  priceDownSvg,
  priceUpSvg,
  transferOutlineSvg,
  undelegateOutlineSvg,
  unlockOutlineSvg
} from "@/assets/img/svg";
import { Tooltip } from "@ui/tooltip";
import React, { useMemo } from "react";
import { proxifyImageSrc } from "@ecency/render-helper";
import { useGlobalStore } from "@/core/global-store";
import { HiveEngineToken } from "@/utils";
import { getAllHiveEngineTokensQuery } from "@/api/queries";
import { TransferMode } from "@/features/shared";
import { Account } from "@/entities";
import { motion } from "framer-motion";
import { UilInfoCircle } from "@tooni/iconscout-unicons-react";

interface Props {
  i: number;
  account: Account;
  token: HiveEngineToken;
  openTransferDialog: (mode: TransferMode, asset: string, balance: number) => void;
}

export function WalletEngineTokenItem({ token, openTransferDialog, account, i }: Props) {
  const canUseWebp = useGlobalStore((s) => s.canUseWebp);
  const isMobile = useGlobalStore((s) => s.isMobile);
  const activeUser = useGlobalStore((s) => s.activeUser);

  const { data: allTokens } = getAllHiveEngineTokensQuery().useClientQuery();

  const isMyPage = useMemo(() => activeUser?.username === account.name, []);
  const imageSrc = proxifyImageSrc(token.icon, 0, 0, canUseWebp ? "webp" : "match");

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ delay: i * 0.1 }}
      className="bg-light-200 dark:bg-dark-200 flex justify-between items-start rounded-2xl p-4 xl:p-6"
    >
      <div className="flex flex-col gap-4 font-semibold">
        <Image
          width={1000}
          height={1000}
          alt={token.symbol}
          src={imageSrc ?? "/assets/noimage.svg"}
          className="item-image"
        />
        {token.symbol}
      </div>

      {!isMobile && (
        <div className="flex">
          <HiveEngineChart items={token} />
        </div>
      )}

      <div className="ml-auto flex flex-col justify-between">
        <div className="flex items-center gap-1 mb-1 align-self-end">
          <div className="text-blue-dark-sky font-semibold">{token.balanced()}</div>

          <Popover anchorParent={true}>
            <div className="flex flex-col gap-3 p-4 opacity-75">
              <p>
                {i18next.t("wallet-engine.token")}:{" "}
                <span className="text-blue-dark-sky font-semibold">{token.name}</span>
              </p>
              <p>
                {i18next.t("wallet-engine.balance")}:{" "}
                <span className="text-blue-dark-sky font-semibold">{token.balanced()}</span>
              </p>
              <p>
                {i18next.t("wallet-engine.staked")}:{" "}
                <span className="text-blue-dark-sky font-semibold">{token.staked()}</span>
              </p>
              {token.delegationEnabled && (
                <>
                  <p>In: {token.delegationsIn}</p>
                  <p>Out: {token.delegationsOut}</p>
                </>
              )}
            </div>
          </Popover>
          <UilInfoCircle className="w-5 h-5 cursor-pointer hover:opacity-50 opacity-75" />
        </div>

        <div className="mr-3">
          {allTokens?.map((x: any, i: any) => {
            const changeValue = parseFloat(x?.priceChangePercent);
            return (
              <span
                key={i}
                className={`flex justify-end ${changeValue < 0 ? "text-red" : "text-green"}`}
              >
                {x?.symbol === token.symbol && (
                  <span className="mr-1">{changeValue < 0 ? priceDownSvg : priceUpSvg}</span>
                )}
                {x?.symbol === token.symbol ? x?.priceChangePercent : null}
              </span>
            );
          })}
        </div>

        {isMyPage && (
          <div className="flex justify-between ml-auto">
            <div className="mr-1">
              <Tooltip content="Transfer">
                <div className="flex items-center flex-justify-center">
                  <span
                    onClick={() => openTransferDialog("transfer", token.symbol, token.balance)}
                    className="he-icon mr-0 mr-md-2"
                  >
                    {transferOutlineSvg}
                  </span>
                </div>
              </Tooltip>
            </div>

            {token.delegationEnabled && token.delegationsOut !== token.balance && (
              <div className="mr-1">
                <Tooltip content="Delegate">
                  <div className="flex items-center flex-justify-center">
                    <span
                      onClick={() =>
                        openTransferDialog(
                          "delegate",
                          token.symbol,
                          token.balance - token.delegationsOut
                        )
                      }
                      className="he-icon mr-0 mr-md-2"
                    >
                      {delegateOutlineSvg}
                    </span>
                  </div>
                </Tooltip>
              </div>
            )}
            {token.delegationEnabled && token.delegationsOut > 0 && (
              <div className="mr-1">
                <Tooltip content="Undelegate">
                  <div className="flex items-center flex-justify-center">
                    <span
                      onClick={() =>
                        openTransferDialog("undelegate", token.symbol, token.delegationsOut)
                      }
                      className="he-icon mr-0 mr-md-2"
                    >
                      {undelegateOutlineSvg}
                    </span>
                  </div>
                </Tooltip>
              </div>
            )}

            {token.stakingEnabled && (
              <div className="mr-1">
                <Tooltip content="Stake">
                  <div className="flex items-center flex-justify-center items-center">
                    <span
                      onClick={() => openTransferDialog("stake", token.symbol, token.balance)}
                      className="he-icon mr-0 mr-md-2"
                    >
                      {lockOutlineSvg}
                    </span>
                  </div>
                </Tooltip>
              </div>
            )}
            {token.stake > 0 && (
              <div className="mr-1">
                <Tooltip content="Unstake">
                  <div className="flex items-center flex-justify-center items-center">
                    <span
                      onClick={() =>
                        openTransferDialog("unstake", token.symbol, token.stakedBalance)
                      }
                      className="he-icon mr-0 mr-md-2"
                    >
                      {unlockOutlineSvg}
                    </span>
                  </div>
                </Tooltip>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
