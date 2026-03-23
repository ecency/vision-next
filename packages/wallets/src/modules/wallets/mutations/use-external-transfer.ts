import { EcencyWalletCurrency } from "@/modules/wallets/enums";
import { sendEvmTransfer, parseToWei } from "@/modules/wallets/utils/metamask-evm-transfer";
import { sendSolTransfer } from "@/modules/wallets/utils/metamask-sol-transfer";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface ExternalTransferPayload {
  to: string;
  amount: string;
}

export function useExternalTransfer(currency: EcencyWalletCurrency) {
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
        default:
          throw new Error(`Transfers not supported for ${currency}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === "ecency-wallets" &&
          (query.queryKey as string[]).some(
            (k) => typeof k === "string" && k.toLowerCase().includes("balance")
          )
      });
    }
  });
}
