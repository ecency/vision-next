import { TransferFormHeader } from "@/features/shared/transfer/transfer-form-header";
import { LinearProgress, error } from "@/features/shared";
import { Button } from "@/features/ui";
import i18next from "i18next";
import React, { useCallback } from "react";
import { useTransferSharedState } from "./transfer-shared-state";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { useSignTransfer } from "@/api/mutations";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { invalidateWalletQueries } from "@/features/wallet/utils/invalidate-wallet-queries";
import { getAccountFullQueryOptions } from "@ecency/sdk";
import { formatError } from "@/api/format-error";

interface Props {
  onHide: () => void;
}

export function TransferStep3({ onHide }: Props) {
  const { activeUser } = useActiveAccount();

  const { step, setStep, to, amount, asset, mode, memo, inProgress } = useTransferSharedState();

  const { refetch } = useQuery(getAccountFullQueryOptions(activeUser?.username));
  const queryClient = useQueryClient();

  const { mutateAsync: sign, isPending } = useSignTransfer(mode, asset);

  const handleSign = useCallback(async () => {
    try {
      await sign({ to, amount, memo });
      await refetch();
      invalidateWalletQueries(queryClient, activeUser?.username);
      setStep(4);
    } catch (e) {
      error(...formatError(e));
    }
  }, [activeUser?.username, amount, memo, queryClient, refetch, setStep, sign, to]);

  return (
    <div className="transaction-form">
      <TransferFormHeader title="sign-title" step={step} subtitle="sign-sub-title" />
      {(inProgress || isPending) && <LinearProgress />}
      <div className="transaction-form">
        <div className="flex justify-center py-4">
          <Button
            onClick={handleSign}
            disabled={inProgress || isPending}
            appearance="primary"
          >
            {i18next.t("trx-common.sign-title")}
          </Button>
        </div>
        <p className="text-center">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setStep(2);
            }}
          >
            {i18next.t("g.back")}
          </a>
        </p>
      </div>
    </div>
  );
}
