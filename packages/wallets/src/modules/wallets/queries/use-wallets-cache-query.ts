import { useQuery, useQueryClient } from "@tanstack/react-query";
import { EcencyWalletCurrency } from "../enums";
import { EcencyTokenMetadata } from "../types";

export function useWalletsCacheQuery(username?: string) {
  const queryClient = useQueryClient();
  const queryKey = ["ecency-wallets", "wallets", username] as const;

  const getCachedWallets = () =>
    queryClient.getQueryData<Map<EcencyWalletCurrency, EcencyTokenMetadata>>(queryKey);

  const createEmptyWalletMap = () =>
    new Map<EcencyWalletCurrency, EcencyTokenMetadata>();

  return useQuery<Map<EcencyWalletCurrency, EcencyTokenMetadata>>({
    queryKey,
    enabled: Boolean(username),
    initialData: () => getCachedWallets() ?? createEmptyWalletMap(),
    queryFn: async () => getCachedWallets() ?? createEmptyWalletMap(),
    staleTime: Infinity,
  });
}
