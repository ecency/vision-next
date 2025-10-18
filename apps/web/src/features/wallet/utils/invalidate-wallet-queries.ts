import { QueryClient } from "@tanstack/react-query";

const WALLET_QUERY_NAMESPACE = "ecency-wallets" as const;
const ASSETS_QUERY_NAMESPACE = "assets" as const;
const ASSET_GENERAL_INFO_SCOPE = "general-info" as const;

const USER_SCOPED_QUERY_KEYS = new Set([
  "asset-info",
  "list",
  "wallets",
  "all-tokens-list"
]);

function isWalletNamespaceQuery(
  queryKey: unknown,
  username: string
): boolean {
  if (!Array.isArray(queryKey)) {
    return false;
  }

  if (queryKey[0] !== WALLET_QUERY_NAMESPACE) {
    return false;
  }

  const scope = queryKey[1];

  if (!USER_SCOPED_QUERY_KEYS.has(scope as string)) {
    return false;
  }

  return queryKey[2] === username;
}

function isAssetGeneralInfoQuery(
  queryKey: unknown,
  username: string
): boolean {
  if (!Array.isArray(queryKey)) {
    return false;
  }

  if (queryKey[0] !== ASSETS_QUERY_NAMESPACE) {
    return false;
  }

  if (!queryKey.includes(ASSET_GENERAL_INFO_SCOPE)) {
    return false;
  }

  return queryKey[queryKey.length - 1] === username;
}

export function invalidateWalletQueries(
  queryClient: QueryClient,
  username?: string
) {
  if (!username) {
    return;
  }

  setTimeout(() => {
    queryClient.invalidateQueries({
      predicate: ({ queryKey }) =>
        isWalletNamespaceQuery(queryKey, username) ||
        isAssetGeneralInfoQuery(queryKey, username)
    });
  }, 5000);
}
