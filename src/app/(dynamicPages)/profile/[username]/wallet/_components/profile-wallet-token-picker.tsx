"use client";

import { SearchBox } from "@/features/shared";
import { Button, FormControl, Modal, ModalBody, ModalHeader } from "@/features/ui";
import { List, ListItem } from "@/features/ui/list";
import { useGetAllTokensListQuery } from "@ecency/wallets";
import { UilCog, UilTimesCircle } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import { useState, ChangeEvent, useMemo } from "react";

export function ProfileWalletTokenPicker() {
  const [show, setShow] = useState(false);
  const [query, setQuery] = useState("");

  const allTokens = useGetAllTokensListQuery(query);

  return (
    <>
      <Button icon={<UilCog />} appearance="gray-link" onClick={() => setShow(true)} />
      <Modal show={show} onHide={() => setShow(false)} centered={true}>
        <ModalHeader closeButton={true}>{i18next.t("profile-wallet.pick-tokens")}</ModalHeader>
        <ModalBody>
          <SearchBox
            placeholder={i18next.t("profile-wallet.search-token")}
            value={query}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value.toLowerCase())}
            autoComplete="off"
          />
          {allTokens.basic.length > 0 && (
            <>
              <div className="text-sm opacity-50 mt-4 mb-2">Basic</div>
              <List>
                {allTokens.basic.map((token) => (
                  <ListItem className="!flex items-center gap-2" key={token}>
                    <FormControl type="checkbox" checked={false} onChange={(e) => {}} />
                    {token}
                  </ListItem>
                ))}
              </List>
            </>
          )}

          {allTokens.external.length > 0 && (
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

          {allTokens.layer2.length > 0 && (
            <>
              <div className="text-sm opacity-50 mt-4 mb-2">Layer 2</div>
              <List>
                {allTokens.layer2.map((token) => (
                  <ListItem className="!flex items-center gap-2" key={token}>
                    <FormControl type="checkbox" checked={false} onChange={(e) => {}} />
                    {token}
                  </ListItem>
                ))}
              </List>
            </>
          )}
          {allTokens.basic.length === 0 &&
            allTokens.external.length === 0 &&
            allTokens.layer2.length === 0 && (
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
