"use client";

import { SearchBox } from "@/features/shared";
import { Button, FormControl, Modal, ModalBody, ModalHeader } from "@/features/ui";
import { List, ListItem } from "@/features/ui/list";
import { UilCog, UilTimesCircle } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import { useState, ChangeEvent, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  EcencyWalletCurrency,
  getAccountWalletListQueryOptions,
  getAllTokensListQueryOptions,
  useSaveWalletInformationToMetadata
} from "@ecency/wallets";
import Image from "next/image";
import { proxifyImageSrc } from "@ecency/render-helper";
import { useParams } from "next/navigation";
import { useClientActiveUser } from "@/api/queries";
import { getAccessToken } from "@/utils/user-token";
import { TOKEN_LOGOS_MAP } from "@/features/wallet";
import { getLayer2TokenIcon } from "@/features/wallet/utils/get-layer2-token-icon";
import * as R from "remeda";
import {
  AccountProfile,
  WalletMetadataCandidate,
  checkUsernameWalletsPendingQueryOptions,
  getAccountFullQueryOptions
} from "@ecency/sdk";
import { sanitizeWalletUsername } from "@/features/wallet/utils/sanitize-username";

type AccountProfileToken = NonNullable<AccountProfile["tokens"]>[number];

function normalizeChainTokenCandidate(
  candidate: WalletMetadataCandidate | AccountProfileToken | undefined
): AccountProfileToken | undefined {
  if (!candidate || typeof candidate !== "object") {
    return;
  }

  const normalizedCandidate = candidate as Record<string, unknown>;

  const symbol =
    typeof normalizedCandidate.symbol === "string"
      ? (normalizedCandidate.symbol as string)
      : typeof normalizedCandidate.currency === "string"
      ? (normalizedCandidate.currency as string)
      : undefined;

  if (!symbol) {
    return;
  }

  const type =
    typeof normalizedCandidate.type === "string"
      ? (normalizedCandidate.type as string)
      : undefined;

  const metaSource =
    normalizedCandidate.meta && typeof normalizedCandidate.meta === "object"
      ? {
          ...(normalizedCandidate.meta as Record<string, unknown>),
        }
      : {};

  if (typeof normalizedCandidate.address === "string" && normalizedCandidate.address) {
    (metaSource as Record<string, unknown>).address = normalizedCandidate.address;
  }

  const showValue =
    typeof normalizedCandidate.show === "boolean"
      ? (normalizedCandidate.show as boolean)
      : typeof metaSource.show === "boolean"
      ? (metaSource.show as boolean)
      : false;

  const metaWithShow = {
    ...metaSource,
    show: showValue,
  };

  const sanitizedMeta = Object.fromEntries(
    Object.entries(metaWithShow).filter(([key, value]) => {
      if (key === "address") {
        return typeof value === "string" && Boolean(value);
      }

      if (key === "show") {
        return typeof value === "boolean";
      }

      return false;
    })
  );

  return {
    symbol,
    type: type ?? "CHAIN",
    meta: sanitizedMeta as Record<string, any>
  } satisfies AccountProfileToken;
}

export function ProfileWalletTokenPicker() {
  const { username } = useParams();
  const activeUser = useClientActiveUser();

  const [show, setShow] = useState(false);
  const [query, setQuery] = useState("");

  const normalizedQuery = useMemo(() => query.trim().toLowerCase(), [query]);

  const profileUsername = useMemo(
    () => sanitizeWalletUsername(username),
    [username]
  );

  const isOwnProfile = activeUser?.username === profileUsername;
  const accessToken = isOwnProfile ? getAccessToken(profileUsername) : undefined;

  const { data: allTokens } = useQuery(
    getAllTokensListQueryOptions(profileUsername)
  );
  const { data: walletList } = useQuery(getAccountWalletListQueryOptions(profileUsername));
  const { data: account } = useQuery(getAccountFullQueryOptions(profileUsername));
  const { data: walletCheck } = useQuery({
    ...checkUsernameWalletsPendingQueryOptions(profileUsername, accessToken),
    enabled:
      isOwnProfile && Boolean(profileUsername) && Boolean(accessToken),
  });

  const supportedChainSymbols = useMemo(
    () => new Set<string>(Object.values(EcencyWalletCurrency)),
    []
  );

  const pendingChainTokens = useMemo(() => {
    if (!walletCheck) {
      return [] as AccountProfileToken[];
    }

    const candidates: (
      | WalletMetadataCandidate
      | AccountProfileToken
      | undefined
    )[] = [];

    if (Array.isArray(walletCheck.tokens)) {
      candidates.push(...walletCheck.tokens);
    }

    if (Array.isArray(walletCheck.wallets)) {
      candidates.push(...walletCheck.wallets);
    }

    const normalized = candidates
      .map((candidate) => normalizeChainTokenCandidate(candidate))
      .filter((token): token is AccountProfileToken => Boolean(token));

    const unique = new Map<string, AccountProfileToken>();
    normalized.forEach((token) => {
      if (token && !unique.has(token.symbol)) {
        unique.set(token.symbol, token);
      }
    });

    return Array.from(unique.values());
  }, [walletCheck]);

  const availableChainTokens = useMemo(() => {
    const tokensMap = new Map<string, AccountProfileToken>();

    const addToken = (token?: AccountProfileToken) => {
      if (!token || typeof token.symbol !== "string") {
        return;
      }

      if (token.type !== "CHAIN" && !supportedChainSymbols.has(token.symbol)) {
        return;
      }

      tokensMap.set(token.symbol, {
        symbol: token.symbol,
        type: token.type ?? "CHAIN",
        meta: token.meta ?? {}
      });
    };

    if (Array.isArray(account?.profile?.tokens)) {
      account.profile.tokens.forEach((token) =>
        addToken(token as AccountProfileToken)
      );
    }

    pendingChainTokens.forEach((token) => {
      if (!tokensMap.has(token.symbol)) {
        addToken(token);
      }
    });

    return Array.from(tokensMap.values());
  }, [account?.profile?.tokens, pendingChainTokens, supportedChainSymbols]);

  const availableExternalTokenSymbols = useMemo(() => {
    return new Set(
      availableChainTokens
        .map((token) => token.symbol)
        .filter((symbol): symbol is string => typeof symbol === "string")
    );
  }, [availableChainTokens]);

  const externalTokens = useMemo(() => {
    if (availableExternalTokenSymbols.size === 0) {
      return [];
    }

    const matchesQuery = (value: string) =>
      !normalizedQuery || value.toLowerCase().includes(normalizedQuery);

    const availableSymbols = Array.from(availableExternalTokenSymbols).filter((symbol) =>
      matchesQuery(symbol)
    );

    if (availableSymbols.length === 0) {
      return [];
    }

    const orderedTokens = new Set<string>();

    if (Array.isArray(allTokens?.external)) {
      allTokens.external.forEach((token) => {
        if (availableSymbols.includes(token)) {
          orderedTokens.add(token);
        }
      });
    }

    availableSymbols.forEach((symbol) => {
      if (!orderedTokens.has(symbol)) {
        orderedTokens.add(symbol);
      }
    });

    return R.sortBy(Array.from(orderedTokens), (token) => token.toLowerCase());
  }, [allTokens?.external, availableExternalTokenSymbols, normalizedQuery]);

  const filteredBasicTokens = useMemo(() => {
    const tokens = allTokens?.basic ?? [];

    if (!normalizedQuery) {
      return R.sortBy(tokens, (token) => token.toLowerCase());
    }

    return R.sortBy(
      tokens.filter((token) => token.toLowerCase().includes(normalizedQuery)),
      (token) => token.toLowerCase()
    );
  }, [allTokens?.basic, normalizedQuery]);

  const filteredSpkTokens = useMemo(() => {
    const tokens = allTokens?.spk ?? [];

    if (!normalizedQuery) {
      return R.sortBy(tokens, (token) => token.toLowerCase());
    }

    return R.sortBy(
      tokens.filter((token) => token.toLowerCase().includes(normalizedQuery)),
      (token) => token.toLowerCase()
    );
  }, [allTokens?.spk, normalizedQuery]);

  const filteredLayer2Tokens = useMemo(() => {
    const tokens = allTokens?.layer2 ?? [];

    if (!normalizedQuery) {
      return R.sortBy(
        tokens,
        (token) => token.symbol?.toLowerCase() ?? token.name?.toLowerCase() ?? ""
      );
    }

    return R.sortBy(
      tokens.filter((token) => {
        const symbolMatches = token.symbol
          ?.toLowerCase()
          .includes(normalizedQuery);
        const nameMatches = token.name?.toLowerCase().includes(normalizedQuery);

        return Boolean(symbolMatches || nameMatches);
      }),
      (token) => token.symbol?.toLowerCase() ?? token.name?.toLowerCase() ?? ""
    );
  }, [allTokens?.layer2, normalizedQuery]);

  const { mutateAsync: updateWallet } = useSaveWalletInformationToMetadata(profileUsername);

  const chainTokensBySymbol = useMemo(() => {
    return new Map(
      availableChainTokens
        .filter((token) => typeof token.symbol === "string")
        .map((token) => [token.symbol as string, token])
    );
  }, [availableChainTokens]);

  const togglableTokenSymbols = useMemo(() => {
    return new Set(
      [
        ...Array.from(availableExternalTokenSymbols.values()),
        ...(allTokens?.spk ?? []),
        ...(allTokens?.layer2?.map((token) => token.symbol) ?? []),
      ].filter(Boolean)
    );
  }, [
    availableExternalTokenSymbols,
    allTokens?.spk,
    allTokens?.layer2,
  ]);

  const update = useCallback(
    (token: string) => {
      let list = [...(walletList ?? [])];

      if (list.includes(token)) {
        const index = list.indexOf(token);
        delete list[index];
      } else {
        list.push(token);
      }

      list = list.filter((i) => !!i);

      const nextListSet = new Set(list);
      const previousListSet = new Set(walletList ?? []);
      const hiddenTokens = new Set(
        [...Array.from(previousListSet.values())].filter(
          (symbol) => togglableTokenSymbols.has(symbol) && !nextListSet.has(symbol)
        )
      );

      updateWallet([
        ...R.pipe(
          allTokens?.basic ?? [],
          R.map((currency) => ({ currency, type: "HIVE", show: true }))
        ),
        ...Array.from(chainTokensBySymbol.values()).map((chainToken) => ({
          currency: chainToken.symbol!,
          type: chainToken.type ?? "CHAIN",
          ...(chainToken.meta ?? {}),
          show: nextListSet.has(chainToken.symbol as string)
        })),
        ...R.pipe(
          allTokens?.spk ?? [],
          R.filter((currency) => nextListSet.has(currency) || hiddenTokens.has(currency)),
          R.map((currency) => ({
            currency,
            type: "SPK",
            show: nextListSet.has(currency)
          }))
        ),
        ...R.pipe(
          allTokens?.layer2 ?? [],
          R.filter(({ symbol }) => nextListSet.has(symbol) || hiddenTokens.has(symbol)),
          R.map(({ symbol: currency }) => ({
            currency,
            type: "ENGINE",
            show: nextListSet.has(currency)
          }))
        )
      ]);
    },
    [updateWallet, walletList, allTokens, chainTokensBySymbol, togglableTokenSymbols]
  );

  if (activeUser?.username !== profileUsername) {
    return <></>;
  }

  return (
    <>
      <Button size="sm" icon={<UilCog />} appearance="gray-link" onClick={() => setShow(true)}>
        {i18next.t("profile-wallet.setup-tokens")}
      </Button>
      <Modal show={show} onHide={() => setShow(false)} centered={true}>
        <ModalHeader closeButton={true}>{i18next.t("profile-wallet.pick-tokens")}</ModalHeader>
        <ModalBody>
          <SearchBox
            placeholder={i18next.t("profile-wallet.search-token")}
            value={query}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
            autoComplete="off"
          />
          {filteredBasicTokens.length > 0 && (
            <>
              <div className="text-sm opacity-50 mt-4 mb-2">Basic</div>
              <List>
                {filteredBasicTokens.map((token) => (
                  <ListItem className="!flex items-center gap-2" key={token}>
                    <FormControl
                      type="checkbox"
                      disabled={true}
                      checked={walletList?.includes(token) ?? false}
                      onChange={() => {}}
                    />
                    <div>{TOKEN_LOGOS_MAP[token]}</div>
                    {token}
                  </ListItem>
                ))}
              </List>
            </>
          )}

          {externalTokens.length > 0 && (
            <>
              <div className="text-sm opacity-50 mt-4 mb-2">Chain</div>
              <List>
                {externalTokens.map((token) => (
                  <ListItem className="!flex items-center gap-2" key={token}>
                    <FormControl
                      type="checkbox"
                      checked={walletList?.includes(token) ?? false}
                      onChange={() => update(token)}
                    />
                    {token}
                  </ListItem>
                ))}
              </List>
            </>
          )}

          {filteredSpkTokens.length > 0 && (
            <>
              <div className="text-sm opacity-50 mt-4 mb-2">SPK</div>
              <List>
                {filteredSpkTokens.map((token) => (
                  <ListItem className="!flex items-center gap-2" key={token}>
                    <FormControl
                      type="checkbox"
                      checked={walletList?.includes(token) ?? false}
                      onChange={() => update(token)}
                    />
                    <div>{TOKEN_LOGOS_MAP[token]}</div>
                    {token}
                  </ListItem>
                ))}
              </List>
            </>
          )}

          {filteredLayer2Tokens.length > 0 && (
            <>
              <div className="text-sm opacity-50 mt-4 mb-2">Hive engine</div>
              <List>
                {filteredLayer2Tokens.map((token) => {
                  const icon = getLayer2TokenIcon(token.metadata);

                  return (
                    <ListItem className="!flex items-center gap-2" key={token.name}>
                      <FormControl
                        type="checkbox"
                        checked={walletList?.includes(token.symbol) ?? false}
                        onChange={() => update(token.symbol)}
                      />
                      {icon ? (
                        <Image
                          alt=""
                          src={proxifyImageSrc(icon, 32, 32, "match")}
                          width={32}
                          height={32}
                          className="rounded-lg object-cover min-w-[32px] max-w-[32px] h-[32px] border border-[--border-color]"
                        />
                      ) : (
                        <div className="rounded-lg min-w-[32px] max-w-[32px] h-[32px] border border-[--border-color] flex items-center justify-center bg-gray-100 dark:bg-gray-900 text-[10px] font-semibold uppercase text-gray-600 dark:text-gray-200">
                          {token.symbol.slice(0, 3)}
                        </div>
                      )}

                      <div>
                        {token.name}
                        <div className="text-sm opacity-75">{token.symbol}</div>
                      </div>
                    </ListItem>
                  );
                })}
              </List>
            </>
          )}
          {filteredBasicTokens.length === 0 &&
            externalTokens.length === 0 &&
            filteredLayer2Tokens.length === 0 &&
            filteredSpkTokens.length === 0 && (
              <div className="flex flex-col gap-2 items-center justify-center p-4 text-sm opacity-50">
                <UilTimesCircle className="w-8 h-8" />
                <span>No tokens found</span>
              </div>
            )}
        </ModalBody>
      </Modal>
    </>
  );
}
