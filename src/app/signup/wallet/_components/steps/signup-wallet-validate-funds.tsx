import { EcencyCreateWalletInformation, EcencyWalletCurrency } from "@ecency/wallets";
import { useQuery } from "@tanstack/react-query";
import i18next from "i18next";
import { useMemo, useState } from "react";
import { SignupWalletValidationItem } from "./signup-wallet-validation-item";
import { SignupWalletValiadtionSelected } from "./signup-wallet-validation-selected";
import { SignupWalletConnectWalletImport } from "./signup-wallet-connect-wallet-import";

interface Props {
  username: string;
  onValid: () => void;
}

const TOKENS = [
  EcencyWalletCurrency.BTC,
  EcencyWalletCurrency.ETH,
  EcencyWalletCurrency.SOL,
  EcencyWalletCurrency.TON,
  EcencyWalletCurrency.TRON,
  EcencyWalletCurrency.APT,
  EcencyWalletCurrency.ATOM
];

export function SignupWalletValidateFunds({ username, onValid }: Props) {
  const [selectedWallet, setSelectedWallet] = useState<[EcencyWalletCurrency, string]>();

  return (
    <div className="flex flex-col gap-4 w-full">
      <div>
        <div className="text-lg font-semibold">
          {i18next.t("signup-wallets.validate-funds.title")}
        </div>
        <div className="opacity-50">{i18next.t("signup-wallets.validate-funds.description")}</div>
      </div>
      {!selectedWallet && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {TOKENS.map((currency, i) => (
            <SignupWalletValidationItem
              username={username}
              i={i}
              selectable={true}
              key={i}
              currency={currency}
              onSelect={(wallet) => setSelectedWallet([wallet.currency, wallet.address])}
            />
          ))}
        </div>
      )}
      {selectedWallet && (
        <SignupWalletValiadtionSelected
          username={username}
          selected={selectedWallet}
          onCancel={() => setSelectedWallet(undefined)}
          onValid={onValid}
        />
      )}
      <div className="flex items-center mt-4 justify-between">
        <SignupWalletConnectWalletImport username={username} />
      </div>
    </div>
  );
}
