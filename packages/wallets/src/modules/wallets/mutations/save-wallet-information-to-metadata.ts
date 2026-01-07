import {
  AccountProfile,
  getAccountFullQueryOptions,
  useAccountUpdate,
} from "@ecency/sdk";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { EcencyTokenMetadata } from "../types";
import * as R from "remeda";
import { getAccountWalletListQueryOptions } from "../queries";
import { EcencyWalletCurrency } from "../enums";

function getGroupedChainTokens(
  tokens?: AccountProfile["tokens"],
  defaultShow?: boolean
) {
  if (!tokens) {
    return {};
  }

  return R.pipe(
    tokens,
    R.filter(
      ({ type, symbol }) =>
        type === "CHAIN" ||
        Object.values(EcencyWalletCurrency).includes(symbol as any)
    ),
    R.map((item) => {
      const meta = {
        ...(item.meta ?? {}),
      } as Record<string, unknown>;

      if (typeof meta.show !== "boolean" && typeof defaultShow === "boolean") {
        meta.show = defaultShow;
      }

      return {
        ...item,
        meta,
      };
    }),
    // Chain tokens are unique by symbol, so indexing by symbol
    // gives a direct lookup map instead of an array-based grouping.
    R.indexBy(
      (item: NonNullable<AccountProfile["tokens"]>[number]) => item.symbol
    )
  );
}

/**
 * Saving of token(s) metadata to Hive profile
 * It may contain: external wallets(see EcencyWalletCurrency), Hive tokens arrangement
 *
 * Basically, this mutation is a convenient wrapper for update profile operation
 */
type SaveWalletInformationOptions = Pick<
  UseMutationOptions<unknown, Error, EcencyTokenMetadata[]>,
  "onSuccess" | "onError"
>;

export function useSaveWalletInformationToMetadata(
  username: string,
  accessToken?: string,
  auth?: {
    postingKey?: string | null;
    loginType?: string | null;
  },
  options?: SaveWalletInformationOptions
) {
  const queryClient = useQueryClient();

  const { data: accountData } = useQuery(getAccountFullQueryOptions(username));
  const { mutateAsync: updateProfile } = useAccountUpdate(
    username,
    accessToken,
    auth
  );

  return useMutation({
    mutationKey: [
      "ecency-wallets",
      "save-wallet-to-metadata",
      accountData?.name,
    ],
    mutationFn: async (tokens: EcencyTokenMetadata[]) => {
      if (!accountData) {
        throw new Error("[SDK][Wallets] – no account data to save wallets");
      }

      // Chain type tokens couldn't be deleted entirely from the profile list,
      //       then visibility should be controlling using meta.show field
      const profileChainTokens = getGroupedChainTokens(
        accountData.profile?.tokens
      );

      const payloadTokens =
        (tokens.map(({ currency, type, privateKey, username, ...meta }) => ({
          symbol: currency!,
          type:
            type ??
            (Object.values(EcencyWalletCurrency).includes(currency as any)
              ? "CHAIN"
              : undefined),
          meta,
        })) as AccountProfile["tokens"]) ?? [];

      const payloadChainTokens = getGroupedChainTokens(payloadTokens, true);
      const payloadNonChainTokens = payloadTokens.filter(
        ({ type, symbol }) =>
          type !== "CHAIN" &&
          !Object.values(EcencyWalletCurrency).includes(symbol as any)
      );

      const mergedChainTokens = R.pipe(
        profileChainTokens,
        R.mergeDeep(payloadChainTokens),
        R.values()
      );

      return updateProfile({
        tokens: [
          ...payloadNonChainTokens,
          ...mergedChainTokens,
        ] as AccountProfile["tokens"],
      });
    },
    onError: options?.onError,
    onSuccess: (response, vars, context) => {
      (
        options?.onSuccess as
          | ((
              data: unknown,
              variables: EcencyTokenMetadata[],
              context: unknown
            ) => unknown)
          | undefined
      )?.(response, vars, context);
      queryClient.invalidateQueries({
        queryKey: getAccountWalletListQueryOptions(username).queryKey,
      });
    },
  });
}
