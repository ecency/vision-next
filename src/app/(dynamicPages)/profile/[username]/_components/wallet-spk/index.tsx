"use client";
import React, { useMemo, useState } from "react";
import { WalletSpkSection } from "./wallet-spk-section";
import { SendSpkDialog } from "./send-spk-dialog";
import { WalletSpkLarynxPower } from "./wallet-spk-larynx-power";
import { WalletSpkLarynxLocked } from "./wallet-spk-larynx-locked";
import { WalletSpkUnclaimedPoints } from "./wallet-spk-unclaimed-points";
import { WalletSpkDelegatedPowerDialog } from "./wallet-spk-delegated-power-dialog";
import { Account } from "@/entities";
import i18next from "i18next";
import { WalletMenu } from "../wallet-menu";
import { claimLarynxRewards } from "@/api/spk-api";
import { useGlobalStore } from "@/core/global-store";
import { error, success } from "@/features/shared";
import { formatError } from "@/api/operations";
import { getSpkWalletQuery } from "@/api/queries";
import useMount from "react-use/lib/useMount";

export interface Props {
  account: Account;
}

export function WalletSpk({ account }: Props) {
  const activeUser = useGlobalStore((s) => s.activeUser);

  const [prefilledAmount, setPrefilledAmount] = useState("");

  // should !isActiveUserWallet only, otherwise it should be 0
  const { data: activeUserSpkWalletData, refetch: refetchActiveUserData } = getSpkWalletQuery(
    activeUser?.username
  ).useClientQuery();
  const { tokenBalance: activeUserTokenBalance, larynxTokenBalance: activeUserLarynxTokenBalance } =
    activeUserSpkWalletData!;

  const { data: accountSpkData, refetch: refetchAccountData } = getSpkWalletQuery(
    account.name
  ).useClientQuery();
  const {
    tokenBalance,
    larynxTokenBalance,
    larynxLockedBalance,
    larynxPowerBalance,
    larynxPowerRate,
    larynxGrantingBalance,
    larynxGrantedBalance,
    estimatedBalance,
    markets,
    rateLPow,
    rateLDel,
    headBlock,
    powerDownList,
    delegatingItems,
    delegatedItems,
    isNode
  } = accountSpkData!;

  const [sendSpkShow, setSendSpkShow] = useState(false);
  const [delegatedPowerDialogShow, setDelegatedPowerDialogShow] = useState(false);
  const [delegatingPowerDialogShow, setDelegatingPowerDialogShow] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<"SPK" | "LARYNX" | "LP">("SPK");
  const [selectedType, setSelectedType] = useState<
    "transfer" | "delegate" | "powerup" | "powerdown" | "lock" | "unlock"
  >("transfer");
  const [claim, setClaim] = useState("0");
  const [claiming, setClaiming] = useState(false);

  const isActiveUserWallet = useMemo(
    () => activeUser?.username === account.name,
    [account.name, activeUser?.username]
  );

  let balance = "0";

  switch (selectedAsset) {
    case "SPK":
      balance = +isActiveUserWallet ? tokenBalance : activeUserTokenBalance;
      break;
    case "LARYNX":
      if (["transfer", "powerup", "lock"].includes(selectedType)) {
        balance = +isActiveUserWallet ? larynxTokenBalance : activeUserLarynxTokenBalance;
      } else if (selectedType === "delegate") {
        balance = larynxPowerBalance;
      } else if (selectedType === "unlock") {
        balance = larynxLockedBalance;
      }
      break;
    case "LP":
      if (selectedType === "powerdown" || selectedType === "delegate") {
        balance = larynxPowerBalance;
      }
  }

  const claimRewards = () => {
    if (claiming || !activeUser) {
      return;
    }

    setClaiming(true);

    return claimLarynxRewards(activeUser.username)
      .then((account) => {
        success(i18next.t("wallet.claim-reward-balance-ok"));
      })
      .then(() => {
        setClaim("0");
      })
      .catch((err) => {
        console.log(err);
        error(...formatError(err));
      })
      .finally(() => {
        setClaiming(false);
      });
  };

  useMount(() => refetchAccountData());

  return (
    <div className="wallet-ecency wallet-spk">
      <div className="wallet-main">
        <div className="wallet-info">
          {+claim > 0 ? (
            <WalletSpkUnclaimedPoints
              claim={claim}
              claiming={false}
              asset={"LARYNX"}
              isActiveUserWallet={isActiveUserWallet}
              onClaim={() => claimRewards()}
            />
          ) : (
            <></>
          )}
          <WalletSpkSection
            account={account}
            title={i18next.t("wallet.spk.token")}
            description={i18next.t("wallet.spk.token-description")}
            amountSlot={<>{tokenBalance} SPK</>}
            items={[
              {
                label: i18next.t("wallet.transfer"),
                onClick: () => {
                  setSendSpkShow(true);
                  setSelectedAsset("SPK");
                  setSelectedType("transfer");
                }
              }
            ]}
          />
          <WalletSpkSection
            account={account}
            isAlternative={true}
            title={i18next.t("wallet.spk.larynx-token")}
            description={i18next.t("wallet.spk.larynx-token-description")}
            amountSlot={<>{larynxTokenBalance} LARYNX</>}
            items={[
              {
                label: i18next.t("wallet.transfer"),
                onClick: () => {
                  setSendSpkShow(true);
                  setSelectedAsset("LARYNX");
                  setSelectedType("transfer");
                }
              },
              ...(isActiveUserWallet
                ? [
                    {
                      label: i18next.t("wallet.power-up"),
                      onClick: () => {
                        setSendSpkShow(true);
                        setSelectedAsset("LARYNX");
                        setSelectedType("powerup");
                      }
                    }
                  ]
                : []),
              ...(isActiveUserWallet && +larynxTokenBalance > 0
                ? [
                    {
                      label: i18next.t("wallet.spk.lock.button"),
                      onClick: () => {
                        setSendSpkShow(true);
                        setSelectedAsset("LARYNX");
                        setSelectedType("lock");
                      }
                    }
                  ]
                : [])
            ]}
          />
          <WalletSpkLarynxPower
            account={account}
            isActiveUserWallet={isActiveUserWallet}
            rateLDel={rateLDel}
            rateLPow={rateLPow}
            larynxGrantedPower={larynxGrantedBalance}
            larynxGrantingPower={larynxGrantingBalance}
            headBlock={headBlock}
            powerDownList={powerDownList}
            onStop={() => {
              setSendSpkShow(true);
              setSelectedAsset("LP");
              setSelectedType("powerdown");
              setPrefilledAmount("0");
            }}
            larynxPowerRate={larynxPowerRate}
            larynxPowerBalance={larynxPowerBalance}
            onDelegate={() => {
              setSendSpkShow(true);
              setSelectedAsset("LP");
              setSelectedType("delegate");
            }}
            onPowerDown={() => {
              setSendSpkShow(true);
              setSelectedAsset("LP");
              setSelectedType("powerdown");
            }}
            onDlpClick={() => setDelegatedPowerDialogShow(true)}
            onDlipClick={() => setDelegatingPowerDialogShow(true)}
          />
          {larynxLockedBalance && isNode ? (
            <WalletSpkLarynxLocked
              showActions={isActiveUserWallet && +larynxLockedBalance > 0}
              onUnlock={() => {
                setSendSpkShow(true);
                setSelectedAsset("LARYNX");
                setSelectedType("unlock");
              }}
              larynxLockedBalance={larynxLockedBalance}
              account={account}
            />
          ) : (
            <></>
          )}
          <WalletSpkSection
            isAlternative={true}
            items={[]}
            title={i18next.t("wallet.spk.account-value")}
            description={i18next.t("wallet.spk.account-value-description")}
            amountSlot={<div className="amount amount-bold">${estimatedBalance}</div>}
            account={account}
          />
        </div>
        <WalletMenu username={account.name} active="spk" />
      </div>

      <SendSpkDialog
        markets={markets}
        prefilledAmount={prefilledAmount}
        prefilledTo={isActiveUserWallet ? "" : account.name}
        type={selectedType}
        asset={selectedAsset}
        account={account}
        show={sendSpkShow}
        setShow={(v) => setSendSpkShow(v)}
        balance={balance}
        onFinish={() => {
          refetchAccountData();
          refetchActiveUserData();
        }}
      />

      <WalletSpkDelegatedPowerDialog
        show={delegatedPowerDialogShow}
        setShow={(value) => setDelegatedPowerDialogShow(value)}
        items={delegatedItems}
      />
      <WalletSpkDelegatedPowerDialog
        show={delegatingPowerDialogShow}
        setShow={(value) => setDelegatingPowerDialogShow(value)}
        items={delegatingItems}
      />
    </div>
  );
}
