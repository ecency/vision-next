"use client";

import aptSvg from "@/assets/img/currencies/apt.svg";
import atomSvg from "@/assets/img/currencies/atom.svg";
import btcSvg from "@/assets/img/currencies/btc.svg";
import ethSvg from "@/assets/img/currencies/eth.svg";
import solSvg from "@/assets/img/currencies/solana.svg";
import tonSvg from "@/assets/img/currencies/ton.svg";
import tronSvg from "@/assets/img/currencies/tron.svg";
import { ExternalWalletCurrency } from "@/enums";
import { success } from "@/features/shared";
import { Button, FormControl, InputGroup } from "@/features/ui";
import { UilCopy, UilEye } from "@tooni/iconscout-unicons-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { useCopyToClipboard } from "react-use";
import { useSignpupWallet } from "../../_hooks";

const CURRENCIES_DATA = {
  [ExternalWalletCurrency.BTC]: {
    title: "Bitcoin",
    icon: btcSvg
  },
  [ExternalWalletCurrency.ETH]: {
    title: "Etherium",
    icon: ethSvg
  },
  [ExternalWalletCurrency.TRON]: {
    title: "Tron",
    icon: tronSvg
  },
  [ExternalWalletCurrency.TON]: {
    title: "Ton",
    icon: tonSvg
  },
  [ExternalWalletCurrency.SOL]: {
    title: "Solana",
    icon: solSvg
  },
  [ExternalWalletCurrency.ATOM]: {
    title: "ATOM Cosmos",
    icon: atomSvg
  },
  [ExternalWalletCurrency.APT]: {
    title: "Aptos",
    icon: aptSvg
  }
} as const;

interface Props {
  currency: ExternalWalletCurrency;
}

export function SignupWalletConnectWalletItem({ currency }: Props) {
  const { createWallet, importWallet } = useSignpupWallet();

  const [_, copy] = useCopyToClipboard();

  const createWalletButtonText = useMemo(() => {
    if (createWallet.isPending) {
      return "Creating...";
    }

    if (createWallet.isSuccess) {
      return "Created";
    }

    return "Create wallet";
  }, [createWallet.isPending, createWallet.isSuccess]);

  const [hasPrivateKeyRevealed, setHasPrivateKeyRevealed] = useState(false);

  const privateKey = useMemo(
    () => (hasPrivateKeyRevealed ? createWallet.data?.[0] : "************************"),
    [createWallet.data, hasPrivateKeyRevealed]
  );

  return (
    <div
      className="bg-gray-100 dark:bg-dark-600-010 p-4 rounded-xl flex flex-col gap-4"
      key={currency}
    >
      <div className="flex items-center gap-4 justify-between">
        <div className="flex items-center gap-4">
          <Image
            className="w-[2rem] h-[2rem]"
            src={CURRENCIES_DATA[currency].icon.src}
            width={CURRENCIES_DATA[currency].icon.width}
            height={CURRENCIES_DATA[currency].icon.height}
            alt={CURRENCIES_DATA[currency].title}
          />
          <div className="font-semibold">{CURRENCIES_DATA[currency].title}</div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            appearance={createWallet.isSuccess ? "success" : "primary"}
            isLoading={createWallet.isPending}
            disabled={createWallet.isPending}
            size="sm"
            onClick={() => createWallet.isIdle && createWallet.mutateAsync(currency)}
          >
            {createWalletButtonText}
          </Button>
          <Button size="sm" appearance="gray" onClick={() => importWallet(currency)}>
            Import
          </Button>
        </div>
      </div>

      {createWallet.isSuccess && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="text-sm px-2 opacity-75 font-semibold">Address</div>
            <InputGroup
              append={
                <Button
                  appearance="gray-link"
                  icon={<UilCopy />}
                  onClick={() => {
                    copy(createWallet.data?.[1].address);
                    success("Copied!");
                  }}
                />
              }
            >
              <FormControl type="text" readOnly={true} value={createWallet.data?.[1].address} />
            </InputGroup>
          </div>
          <div className="flex flex-col gap-2">
            <div className="text-sm px-2 opacity-75 font-semibold">Public key</div>
            <InputGroup
              append={
                <Button
                  appearance="gray-link"
                  icon={<UilCopy />}
                  onClick={() => {
                    copy(createWallet.data?.[1].publicKey);
                    success("Public key has copied");
                  }}
                />
              }
            >
              <FormControl type="text" readOnly={true} value={createWallet.data?.[1].publicKey} />
            </InputGroup>
          </div>
          <div className="flex flex-col gap-2">
            <div className="text-sm px-2 opacity-75 font-semibold">Private key</div>
            <InputGroup
              append={
                !hasPrivateKeyRevealed && (
                  <Button
                    appearance="gray-link"
                    icon={<UilEye />}
                    onClick={() => setHasPrivateKeyRevealed(true)}
                  />
                )
              }
            >
              <FormControl type="text" readOnly={true} value={privateKey} />
            </InputGroup>
          </div>
        </div>
      )}
    </div>
  );
}
