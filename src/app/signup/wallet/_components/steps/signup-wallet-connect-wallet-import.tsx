import { Button, FormControl, Modal, ModalBody, ModalHeader } from "@/features/ui";
import { List, ListItem } from "@/features/ui/list";
import { EcencyWalletCurrency, useImportWallet } from "@ecency/wallets";
import { UilArrowLeft, UilDownloadAlt } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import Image from "next/image";
import { useEffect, useState } from "react";
import { CURRENCIES_META_DATA } from "../../consts";
import { error, success } from "@/features/shared";
import { formatError } from "@/api/operations";

const CURRENCIES = [
  EcencyWalletCurrency.BTC,
  EcencyWalletCurrency.ETH,
  EcencyWalletCurrency.ATOM,
  EcencyWalletCurrency.TRON
];

interface Props {
  username: string;
}

export function SignupWalletConnectWalletImport({ username }: Props) {
  const [show, setShow] = useState(false);
  const [selectedToken, setSelectedToken] = useState<EcencyWalletCurrency>();
  const [address, setAddress] = useState<string>("");
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
    if (privateKeyOrSeed && address) {
      await importWallet({ privateKeyOrSeed, address });
      success("Wallet imported successully!");
      setShow(false);
      setSelectedToken(undefined);
      setAddress("");
      setPrivateKeyOrSeed("");
    }
  }

  return (
    <>
      <Button appearance="secondary" size="sm" onClick={() => setShow(true)}>
        Import wallet
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
                Import {selectedToken.toUpperCase()} token
              </div>
              <div className="opacity-50 mb-4">
                Import wallet by providing seed phrase/private and address pair. Based on this
                information We can recognize that this wallet as yours.
              </div>
              <div className="flex flex-col gap-4">
                <FormControl
                  type="text"
                  placeholder="Private key or seed phrase"
                  value={privateKeyOrSeed}
                  onChange={(e) => setPrivateKeyOrSeed(e.target.value)}
                />
                <FormControl
                  type="text"
                  placeholder="Address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
                <div className="flex justify-end">
                  <Button
                    disabled={!privateKeyOrSeed || !address}
                    size="sm"
                    icon={<UilDownloadAlt />}
                    onClick={handleImportToken}
                  >
                    Import token
                  </Button>
                </div>
              </div>
            </>
          )}
          {!selectedToken && (
            <>
              <div className="text-lg font-semibold">Select token</div>
              <div className="opacity-50 mb-4">Select on of available tokens to import wallet</div>

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
            Keep in mind, Ecency will never save your private information to any server, browser
            storages. Entered private information will disappear when You will leave this page.
          </div>
        </ModalBody>
      </Modal>
    </>
  );
}
