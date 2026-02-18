import React from "react";
import "./index.scss";
import { Button } from "@ui/button";
import { FullAccount } from "@/entities";
import { useClaimAccountMutation } from "@/api/sdk-mutations";
import i18next from "i18next";
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
    isSuccess
  } = useClaimAccountMutation();

  const claimedAccountCredits = account?.pending_claimed_accounts ?? 0;

  return (
    <div className="claim-credit">
      <div className="claim-credit-title">
        {i18next.t("rc-info.claim-accounts")}
        <span className="text-primary">{claimAccountAmount}</span>
      </div>
      <div className="claim-credit-sub-title">
        <span>{i18next.t("rc-info.you-have-claimed-rc")}</span>
        <span className="text-primary">{claimedAccountCredits}</span>
      </div>
      {!isSuccess &&
      claimAccountAmount > 0 &&
      activeUser?.username === account.name ? (
        <Button
          size="sm"
          isLoading={isPending}
          disabled={isPending}
          onClick={() =>
            claimAccount({ creator: account.name, fee: "0.000 HIVE" })
          }
        >
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
    </div>
  );
};
