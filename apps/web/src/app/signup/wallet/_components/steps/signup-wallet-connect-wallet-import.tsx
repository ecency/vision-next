import { Button, FormControl, Modal, ModalBody, ModalHeader } from "@/features/ui";
import { List, ListItem } from "@/features/ui/list";
import { EcencyWalletCurrency, useImportWallet } from "@ecency/wallets";
import { UilArrowLeft, UilDownloadAlt } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import Image from "next/image";
import { useEffect, useState } from "react";
import { CURRENCIES_META_DATA } from "../../consts";
import { error, success } from "@/features/shared";
import { formatError } from "@/api/format-error";

const CURRENCIES = [
  EcencyWalletCurrency.BTC,
  EcencyWalletCurrency.ETH,
  EcencyWalletCurrency.BNB,
  EcencyWalletCurrency.SOL,
  EcencyWalletCurrency.TON,
  EcencyWalletCurrency.TRON,
  EcencyWalletCurrency.APT
];

interface Props {
  username: string;
}

export function SignupWalletConnectWalletImport({ username }: Props) {
  const [show, setShow] = useState(false);
  const [selectedToken, setSelectedToken] = useState<EcencyWalletCurrency>();
  const [privateKeyOrSeed, setPrivateKeyOrSeed] = useState<string>("");

  const { mutateAsync: importWallet, error: importWalletError } = useImportWallet(
    username,
    selectedToken!
  );

  useEffect(() => {
    if (importWalletError) {
      error(...formatError(importWalletError));
    }
  }, [importWalletError]);

  async function handleImportToken() {
    if (privateKeyOrSeed) {
      await importWallet({ privateKeyOrSeed });
      success(i18next.t("signup-wallets.import.success"));
      setShow(false);
      setSelectedToken(undefined);
      setPrivateKeyOrSeed("");
    }
  }

  return (
    <>
      <Button appearance="secondary" size="sm" onClick={() => setShow(true)}>
        {i18next.t("signup-wallets.import.title")}
      </Button>
      <Modal centered={true} show={show} onHide={() => setShow(false)}>
        <ModalHeader closeButton={true}>
          {selectedToken && (
            <Button
              appearance="gray-link"
              size="sm"
              iconPlacement="left"
              noPadding={true}
              icon={<UilArrowLeft />}
              onClick={() => {
                setSelectedToken(undefined);
              }}
            >
              {i18next.t("g.back")}
            </Button>
          )}
        </ModalHeader>
        <ModalBody>
          {selectedToken && (
            <>
              <div className="text-lg font-semibold">
                {i18next.t("signup-wallets.import.exact-title", {
                  token: selectedToken.toUpperCase()
                })}
              </div>
              <div className="opacity-50 mb-4">
                {i18next.t("signup-wallets.import.exact-description")}
              </div>
              <div className="flex flex-col gap-4">
                <FormControl
                  type="text"
                  placeholder={i18next.t("signup-wallets.import.key-placeholder")}
                  value={privateKeyOrSeed}
                  onChange={(e) => setPrivateKeyOrSeed(e.target.value)}
                />
                <div className="flex justify-end">
                  <Button
                    disabled={!privateKeyOrSeed}
                    size="sm"
                    icon={<UilDownloadAlt />}
                    onClick={handleImportToken}
                  >
                    {i18next.t("signup-wallets.import.import-token")}
                  </Button>
                </div>
              </div>
            </>
          )}
          {!selectedToken && (
            <>
              <div className="text-lg font-semibold">
                {i18next.t("signup-wallets.import.common-title")}
              </div>
              <div className="opacity-50 mb-4">
                {i18next.t("signup-wallets.import.common-description")}
              </div>

              <List>
                {CURRENCIES.map((currency) => (
                  <ListItem
                    className="!flex items-center gap-4 hover:text-blue-dark-sky cursor-pointer hover:bg-blue-dark-sky hover:bg-opacity-5"
                    key={currency}
                    onClick={() => setSelectedToken(currency)}
                  >
                    <Image
                      className="w-[2rem] h-[2rem]"
                      src={CURRENCIES_META_DATA[currency].icon.src}
                      width={CURRENCIES_META_DATA[currency].icon.width}
                      height={CURRENCIES_META_DATA[currency].icon.height}
                      alt={CURRENCIES_META_DATA[currency].title}
                    />
                    <div className="font-semibold">{CURRENCIES_META_DATA[currency].title}</div>
                  </ListItem>
                ))}
              </List>
            </>
          )}
          <div className="text-xs mt-4 text-gray-600 dark:text-gray-400">
            {i18next.t("signup-wallets.import.hint")}
          </div>
        </ModalBody>
      </Modal>
    </>
  );
}
