import { TransferFormHeader } from "@/features/shared/transfer/transfer-form-header";
import i18next from "i18next";
import { UserAvatar, LinearProgress, error } from "@/features/shared";
import { arrowRightSvg } from "@ui/svg";
import { Button } from "@ui/button";
import React, { useCallback, useMemo } from "react";
import { useTransferSharedState } from "./transfer-shared-state";
import { hpToVests } from "@/features/shared/transfer/hp-to-vests";
import { DEFAULT_DYNAMIC_PROPS } from "@/consts/default-dynamic-props";
import { getDynamicPropsQueryOptions, getAccountFullQueryOptions } from "@ecency/sdk";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { useQuery } from "@tanstack/react-query";
import { useSignTransfer } from "@/api/mutations";
import { formatError } from "@/api/format-error";

interface Props {
  titleLngKey: string;
}

export function TransferStep2({ titleLngKey }: Props) {
  const { activeUser } = useActiveAccount();

  const { data: dynamicProps } = useQuery(getDynamicPropsQueryOptions());
  const { step, amount, asset, memo, to, setStep, inProgress, mode } = useTransferSharedState();
  const { refetch } = useQuery(getAccountFullQueryOptions(activeUser?.username));
  const { mutateAsync: signTransfer, isPending } = useSignTransfer(mode, asset);

  const showTo = useMemo(
    () => ["transfer", "transfer-saving", "withdraw-saving", "power-up", "delegate"].includes(mode),
    [mode]
  );

  const handleConfirmAndSign = useCallback(async () => {
    try {
      await signTransfer({ to, amount, memo });
      refetch().catch(() => {});
      setStep(3);
    } catch (e) {
      error(...formatError(e));
    }
  }, [amount, memo, refetch, setStep, signTransfer, to]);

  return (
    <div className="transaction-form">
      <TransferFormHeader title="confirm-title" step={step} subtitle="confirm-sub-title" />
      {(inProgress || isPending) && <LinearProgress />}
      <div className="transaction-form-body">
        <div className="confirmation">
          <div className="confirm-title">{i18next.t(`transfer.${titleLngKey}`)}</div>
          <div className="users">
            <div className="from-user">
              <UserAvatar username={activeUser!.username} size="large" />
            </div>
            {showTo && (
              <>
                <div className="arrow">{arrowRightSvg}</div>
                <div className="to-user">
                  <UserAvatar username={to} size="large" />
                </div>
              </>
            )}
          </div>
          <div className="amount">
            {amount} {asset}
          </div>
          {asset === "HP" && (
            <div className="amount-vests">
              {hpToVests(Number(amount), (dynamicProps ?? DEFAULT_DYNAMIC_PROPS).hivePerMVests)}
            </div>
          )}
          {memo && <div className="memo">{memo}</div>}
        </div>
        <div className="flex justify-center">
          <Button
            appearance="secondary"
            outline={true}
            disabled={inProgress || isPending}
            onClick={() => setStep(1)}
          >
            {i18next.t("g.back")}
          </Button>
          <span className="hr-6px-btn-spacer" />
          <Button disabled={inProgress || isPending} onClick={handleConfirmAndSign}>
            {i18next.t("transfer.confirm")}
          </Button>
        </div>
      </div>
    </div>
  );
}
