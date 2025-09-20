import { WalletTokenAddressItem } from "@/features/wallet";
import { EcencyWalletCurrency } from "@ecency/wallets";
import i18next from "i18next";
import { useState } from "react";
import { SignupWalletConnectWalletImport } from "./signup-wallet-connect-wallet-import";
import { SignupWalletValiadtionSelected } from "./signup-wallet-validation-selected";

interface Props {
  username: string;
  onValid: (selectedWalletCurrency: EcencyWalletCurrency) => void;
}

const TOKENS = [
  EcencyWalletCurrency.BTC,
  EcencyWalletCurrency.ETH,
  EcencyWalletCurrency.SOL,
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
            <WalletTokenAddressItem
              username={username}
              i={i}
              selectable={true}
              key={i}
              currency={currency}
              onSelect={(wallet) =>
                setSelectedWallet([wallet.currency, wallet.address] as [
                  EcencyWalletCurrency,
                  string
                ])
              }
            />
          ))}
        </div>
      )}
      {selectedWallet && (
        <SignupWalletValiadtionSelected
          username={username}
          selected={selectedWallet}
          onCancel={() => setSelectedWallet(undefined)}
          onValid={() => onValid(selectedWallet[0])}
        />
      )}
      {!selectedWallet && (
        <div className="flex items-center mt-4 justify-between">
          <SignupWalletConnectWalletImport username={username} />
        </div>
      )}
    </div>
  );
}
