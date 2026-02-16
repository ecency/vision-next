import { CONFIG, getBoundFetch, QueryKeys } from "@/modules/core";
import { queryOptions } from "@tanstack/react-query";
import { AccountProfile } from "../types";

type AccountProfileToken = NonNullable<AccountProfile["tokens"]>[number];

export type WalletMetadataCandidate = Partial<AccountProfileToken> & {
  currency?: string;
  show?: boolean;
  address?: string;
  publicKey?: string;
  privateKey?: string;
  username?: string;
};

export interface CheckUsernameWalletsPendingResponse {
  exist: boolean;
  tokens?: WalletMetadataCandidate[];
  wallets?: WalletMetadataCandidate[];
}

const RESERVED_META_KEYS = new Set([
  "ownerPublicKey",
  "activePublicKey",
  "postingPublicKey",
  "memoPublicKey",
]);

interface WalletsEndpointResponseItem {
  token?: unknown;
  address?: unknown;
  status?: unknown;
  meta?: unknown;
  username?: unknown;
}

export function checkUsernameWalletsPendingQueryOptions(
  username: string,
  code: string | undefined
) {
  return queryOptions<CheckUsernameWalletsPendingResponse>({
    queryKey: QueryKeys.accounts.checkWalletPending(username, code ?? null),
    queryFn: async () => {
      if (!username || !code) {
        return { exist: false } satisfies CheckUsernameWalletsPendingResponse;
      }

      const fetchApi = getBoundFetch();
      const response = await fetchApi(
        CONFIG.privateApiHost + "/private-api/wallets",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
            code,
          }),
        }
      );

      if (!response.ok) {
        return { exist: false } satisfies CheckUsernameWalletsPendingResponse;
      }

      const payload = (await response.json()) as unknown;

      const wallets: WalletMetadataCandidate[] = Array.isArray(payload)
        ? payload.flatMap((item) => {
            if (!item || typeof item !== "object") {
              return [];
            }

            const walletItem = item as WalletsEndpointResponseItem;

            const symbol =
              typeof walletItem.token === "string"
                ? walletItem.token
                : undefined;

            if (!symbol) {
              return [];
            }

            const meta: Record<string, unknown> =
              walletItem.meta && typeof walletItem.meta === "object"
                ? { ...(walletItem.meta as Record<string, unknown>) }
                : {};

            const sanitizedMeta: Record<string, unknown> = {};

            const address =
              typeof walletItem.address === "string" && walletItem.address
                ? walletItem.address
                : undefined;

            const statusShow =
              typeof walletItem.status === "number"
                ? walletItem.status === 3
                : undefined;

            const showFlag = statusShow ?? false;

            if (address) {
              sanitizedMeta.address = address;
            }

            sanitizedMeta.show = showFlag;

            const baseCandidate = {
              symbol,
              currency: symbol,
              address,
              show: showFlag,
              type: "CHAIN",
              meta: sanitizedMeta,
            } satisfies WalletMetadataCandidate;

            const metaTokenCandidates: WalletMetadataCandidate[] = [];

            for (const [metaSymbol, metaValue] of Object.entries(meta)) {
              if (typeof metaSymbol !== "string") {
                continue;
              }

              if (RESERVED_META_KEYS.has(metaSymbol)) {
                continue;
              }

              if (typeof metaValue !== "string" || !metaValue) {
                continue;
              }

              if (!/^[A-Z0-9]{2,10}$/.test(metaSymbol)) {
                continue;
              }

              metaTokenCandidates.push({
                symbol: metaSymbol,
                currency: metaSymbol,
                address: metaValue,
                show: showFlag,
                type: "CHAIN",
                meta: { address: metaValue, show: showFlag },
              });
            }

            return [baseCandidate, ...metaTokenCandidates];
          })
        : [];

      return {
        exist: wallets.length > 0,
        tokens: wallets.length ? wallets : undefined,
        wallets: wallets.length ? wallets : undefined,
      } satisfies CheckUsernameWalletsPendingResponse;
    },
    refetchOnMount: true,
  });
}
