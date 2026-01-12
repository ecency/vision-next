import React, { useState } from "react";
import "./index.scss";
import { Button } from "@ui/button";
import { FullAccount } from "@/entities";
import { useAccountClaiming } from "@/api/mutations";
import { KeyOrHot } from "@/features/shared";
import { claimAccountByHiveSigner } from "@/api/operations";
import i18next from "i18next";
import { arrowLeftSvg } from "@ui/svg";
import { useActiveAccount } from "@/core/hooks/use-active-account";

interface Props {
  account: FullAccount;
  claimAccountAmount: number;
}

export const ClaimAccountCredit = ({ account, claimAccountAmount }: Props) => {
  const { activeUser } = useActiveAccount();

  const {
    mutateAsync: claimAccount,
    isPending,
    error,
    isSuccess,
    reset
  } = useAccountClaiming(account);

  const [key, setKey] = useState("");
  const [isKeySetting, setIsKeySetting] = useState(false);
  const claimedAccountCredits = account?.pending_claimed_accounts ?? 0;

  return (
    <div className="claim-credit">
      <div className="claim-credit-title">
        {isKeySetting ? (
          <div
            className="claim-credit-title-back"
            onClick={() => {
              setIsKeySetting(false);
              reset();
            }}
          >
            {arrowLeftSvg}
          </div>
        ) : (
          <></>
        )}
        {i18next.t("rc-info.claim-accounts")}
        <span className="text-primary">{claimAccountAmount}</span>
      </div>
      <div className="claim-credit-sub-title">
        <span>{i18next.t("rc-info.you-have-claimed-rc")}</span>
        <span className="text-primary">{claimedAccountCredits}</span>
      </div>
      {!isSuccess &&
      !isKeySetting &&
      claimAccountAmount > 0 &&
      activeUser?.username === account.name ? (
        <Button size="sm" onClick={() => setIsKeySetting(true)}>
          {i18next.t("rc-info.claim")}
        </Button>
      ) : (
        <></>
      )}
      {isSuccess ? (
        <small className="text-success my-3 d-block">
          {i18next.t("rc-info.successfully-claimed")}
        </small>
      ) : (
        <></>
      )}
      {error ? (
        <small className="d-block text-danger my-3">{(error as Error)?.message}</small>
      ) : (
        <></>
      )}
      {isKeySetting && !isSuccess ? (
        <KeyOrHot
          inProgress={isPending}
          onKey={(key) => claimAccount({ key })}
          onHot={() => claimAccountByHiveSigner(account)}
          onKc={() =>
            claimAccount({
              isKeychain: true
            })
          }
        />
      ) : (
        <></>
      )}
    </div>
  );
};
