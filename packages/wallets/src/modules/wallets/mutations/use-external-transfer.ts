import { EcencyWalletCurrency } from "@/modules/wallets/enums";
import { sendEvmTransfer, parseToWei } from "@/modules/wallets/utils/metamask-evm-transfer";
import { sendSolTransfer } from "@/modules/wallets/utils/metamask-sol-transfer";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export type TransferableCurrency =
  | EcencyWalletCurrency.ETH
  | EcencyWalletCurrency.BNB
  | EcencyWalletCurrency.SOL;

interface ExternalTransferPayload {
  to: string;
  amount: string;
}

export function useExternalTransfer(currency: TransferableCurrency) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["ecency-wallets", "external-transfer", currency],
    mutationFn: async ({ to, amount }: ExternalTransferPayload) => {
      switch (currency) {
        case EcencyWalletCurrency.ETH:
        case EcencyWalletCurrency.BNB: {
          const valueHex = parseToWei(amount);
          const txHash = await sendEvmTransfer(to, valueHex, currency);
          return { txHash, currency };
        }
        case EcencyWalletCurrency.SOL: {
          const signature = await sendSolTransfer(to, amount);
          return { txHash: signature, currency };
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["ecency-wallets", "external-wallet-balance"]
      });
    }
  });
}
