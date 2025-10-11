"use client";

import { SearchBox } from "@/features/shared";
import { Button, FormControl, Modal, ModalBody, ModalHeader } from "@/features/ui";
import { List, ListItem } from "@/features/ui/list";
import { UilCog, UilTimesCircle } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import { useState, ChangeEvent, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
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

export function ProfileWalletTokenPicker() {
  const { username } = useParams();
  const activeUser = useClientActiveUser();

  const [show, setShow] = useState(false);
  const [query, setQuery] = useState("");

  const { data: allTokens } = useQuery(getAllTokensListQueryOptions(query));
  const { data: walletList } = useQuery(
    getAccountWalletListQueryOptions((username as string).replace("%40", ""))
  );
  const externalTokens = useMemo(
    () => allTokens?.external.filter((token) => walletList?.includes(token)) ?? [],
    [allTokens]
  );

  const { mutateAsync: updateWallet } = useSaveWalletInformationToMetadata(
    (username as string).replace("%40", "")
  );

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

      // Meta could be empty because this mutation is merging metadata deeply
      //      Even if the given meta is empty it will get meta from profile
      updateWallet([
        ...R.pipe(
          allTokens?.basic.filter((i) => list.includes(i)) ?? [],
          R.map((currency) => ({ currency, type: "HIVE" }))
        ),
        ...R.pipe(
          allTokens?.spk.filter((i) => list.includes(i)) ?? [],
          R.map((currency) => ({ currency, type: "SPK" }))
        ),
        ...R.pipe(
          allTokens?.external.filter((i) => list.includes(i)) ?? [],
          R.map((currency) => ({ currency, type: "CHAIN" }))
        ),
        ...R.pipe(
          allTokens?.layer2?.filter((i) => list.includes(i.symbol)) ?? [],
          R.map(({ symbol: currency }) => ({ currency, type: "ENGINE" }))
        )
      ]);
    },
    [updateWallet, walletList, allTokens]
  );

  if (activeUser?.username !== (username as string).replace("%40", "")) {
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
                      disabled={["POINTS", "HIVE", "HBD"].includes(token)}
                      checked={walletList?.includes(token) ?? false}
                      onChange={() => !["POINTS", "HIVE", "HBD"].includes(token) && update(token)}
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
              <div className="text-sm opacity-50 mt-4 mb-2">External</div>
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
