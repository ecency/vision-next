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
import { TOKEN_LOGOS_MAP } from "@/features/wallet";
import { getLayer2TokenIcon } from "@/features/wallet/utils/get-layer2-token-icon";
import * as R from "remeda";
import { AccountProfile, getAccountFullQueryOptions } from "@ecency/sdk";

export function ProfileWalletTokenPicker() {
  const { username } = useParams();
  const activeUser = useClientActiveUser();

  const [show, setShow] = useState(false);
  const [query, setQuery] = useState("");

  const profileUsername = useMemo(
    () => ((username as string) ?? "").replace("%40", ""),
    [username]
  );

  const { data: allTokens } = useQuery(getAllTokensListQueryOptions(query));
  const { data: walletList } = useQuery(
    getAccountWalletListQueryOptions(profileUsername)
  );
  const { data: account } = useQuery(
    getAccountFullQueryOptions(profileUsername)
  );

  const availableChainTokens = useMemo(() => {
    if (!account?.profile?.tokens || !Array.isArray(account.profile.tokens)) {
      return [] as NonNullable<AccountProfile["tokens"]>;
    }

    return account.profile.tokens.filter(
      ({ symbol, type }) =>
        type === "CHAIN" ||
        Object.values(EcencyWalletCurrency).includes(symbol as EcencyWalletCurrency)
    );
  }, [account?.profile?.tokens]);

  const availableExternalTokenSymbols = useMemo(() => {
    return new Set(
      availableChainTokens
        .map((token) => token.symbol)
        .filter((symbol): symbol is string => typeof symbol === "string")
    );
  }, [availableChainTokens]);

  const externalTokens = useMemo(() => {
    if (!allTokens?.external || availableExternalTokenSymbols.size === 0) {
      return [];
    }

    return allTokens.external.filter((token) =>
      availableExternalTokenSymbols.has(token)
    );
  }, [allTokens?.external, availableExternalTokenSymbols]);

  const { mutateAsync: updateWallet } = useSaveWalletInformationToMetadata(
    profileUsername
  );

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
        ...externalTokens,
        ...(allTokens?.spk ?? []),
        ...(allTokens?.layer2?.map((token) => token.symbol) ?? [])
      ].filter(Boolean)
    );
  }, [externalTokens, allTokens?.spk, allTokens?.layer2]);

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
        [...previousListSet].filter(
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
          show: nextListSet.has(chainToken.symbol as string),
        })),
        ...R.pipe(
          allTokens?.spk ?? [],
          R.filter(
            (currency) =>
              nextListSet.has(currency) || hiddenTokens.has(currency)
          ),
          R.map((currency) => ({
            currency,
            type: "SPK",
            show: nextListSet.has(currency),
          }))
        ),
        ...R.pipe(
          allTokens?.layer2 ?? [],
          R.filter(
            ({ symbol }) =>
              nextListSet.has(symbol) || hiddenTokens.has(symbol)
          ),
          R.map(({ symbol: currency }) => ({
            currency,
            type: "ENGINE",
            show: nextListSet.has(currency),
          }))
        )
      ]);
    },
    [
      updateWallet,
      walletList,
      allTokens,
      chainTokensBySymbol,
      togglableTokenSymbols
    ]
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
            onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value.toLowerCase())}
            autoComplete="off"
          />
          {allTokens && allTokens.basic.length > 0 && (
            <>
              <div className="text-sm opacity-50 mt-4 mb-2">Basic</div>
              <List>
                {allTokens.basic.map((token) => (
                  <ListItem className="!flex items-center gap-2" key={token}>
                    <FormControl
                      type="checkbox"
                      disabled={true}
                      checked={walletList?.includes(token) ?? false}
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

          {allTokens && allTokens.spk.length > 0 && (
            <>
              <div className="text-sm opacity-50 mt-4 mb-2">SPK</div>
              <List>
                {allTokens.spk.map((token) => (
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

          {allTokens?.layer2 && allTokens.layer2.length > 0 && (
            <>
              <div className="text-sm opacity-50 mt-4 mb-2">Hive engine</div>
              <List>
                {allTokens.layer2.map((token) => {
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
                      {token.name}
                    </ListItem>
                  );
                })}
              </List>
            </>
          )}
          {allTokens?.basic.length === 0 &&
            allTokens?.external.length === 0 &&
            allTokens?.layer2?.length === 0 && (
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
