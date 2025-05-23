"use client";

import { SearchBox } from "@/features/shared";
import { Button, FormControl, Modal, ModalBody, ModalHeader } from "@/features/ui";
import { List, ListItem } from "@/features/ui/list";
import { UilCog, UilTimesCircle } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import { useState, ChangeEvent } from "react";
import { TOKEN_LOGOS_MAP } from "../_consts";
import { useQuery } from "@tanstack/react-query";
import { getAllTokensListQueryOptions } from "@ecency/wallets";
import Image from "next/image";
import { proxifyImageSrc } from "@ecency/render-helper";

export default function ProfileWalletTokenPicker() {
  const [show, setShow] = useState(false);
  const [query, setQuery] = useState("");

  const { data: allTokens } = useQuery(getAllTokensListQueryOptions(query));

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
                    <FormControl type="checkbox" checked={false} onChange={(e) => {}} />
                    <div>{TOKEN_LOGOS_MAP[token]}</div>
                    {token}
                  </ListItem>
                ))}
              </List>
            </>
          )}

          {allTokens && allTokens.external.length > 0 && (
            <>
              <div className="text-sm opacity-50 mt-4 mb-2">External</div>
              <List>
                {allTokens.external.map((token) => (
                  <ListItem className="!flex items-center gap-2" key={token}>
                    <FormControl type="checkbox" checked={false} onChange={(e) => {}} />
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
                {allTokens.layer2.map((token) => (
                  <ListItem className="!flex items-center gap-2" key={token.name}>
                    <FormControl type="checkbox" checked={false} onChange={(e) => {}} />
                    <Image
                      alt=""
                      src={proxifyImageSrc(JSON.parse(token.metadata)?.icon, 32, 32, "match")}
                      width={32}
                      height={32}
                      className="rounded-lg object-cover min-w-[32px] max-w-[32px] h-[32px] border border-[--border-color]"
                    />
                    {token.name}
                  </ListItem>
                ))}
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
