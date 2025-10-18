import { QueryClient } from "@tanstack/react-query";

const WALLET_QUERY_NAMESPACE = "ecency-wallets" as const;
const ASSETS_QUERY_NAMESPACE = "assets" as const;
const ASSET_GENERAL_INFO_SCOPE = "general-info" as const;

const USER_SCOPED_QUERY_KEY_PREFIXES = [
  [WALLET_QUERY_NAMESPACE, "asset-info"] as const,
  [WALLET_QUERY_NAMESPACE, "list"] as const,
  [WALLET_QUERY_NAMESPACE, "wallets"] as const,
  [WALLET_QUERY_NAMESPACE, "all-tokens-list"] as const
];

function invalidateWalletNamespaceQueries(
  queryClient: QueryClient,
  username: string
) {
  for (const queryKeyPrefix of USER_SCOPED_QUERY_KEY_PREFIXES) {
    queryClient.invalidateQueries({
      queryKey: [...queryKeyPrefix, username]
    });
  }
}

function invalidateAssetGeneralInfoQueries(
  queryClient: QueryClient,
  username: string
) {
  const generalInfoQueries = queryClient
    .getQueryCache()
    .findAll({ queryKey: [ASSETS_QUERY_NAMESPACE] })
    .filter(({ queryKey }) =>
      Array.isArray(queryKey) &&
      queryKey.includes(ASSET_GENERAL_INFO_SCOPE) &&
      queryKey[queryKey.length - 1] === username
    );

  for (const { queryKey } of generalInfoQueries) {
    queryClient.invalidateQueries({ queryKey });
  }
}

export function invalidateWalletQueries(
  queryClient: QueryClient,
  username?: string
) {
  if (!username) {
    return;
  }

  setTimeout(() => {
    invalidateWalletNamespaceQueries(queryClient, username);
    invalidateAssetGeneralInfoQueries(queryClient, username);
  }, 6000);
}
