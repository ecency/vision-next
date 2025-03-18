import { EcencyCreateWalletInformation, EcencyWalletCurrency } from "@ecency/wallets";
import { useQuery } from "@tanstack/react-query";
import i18next from "i18next";
import { useMemo, useState } from "react";
import { SignupWalletValidationItem } from "./signup-wallet-validation-item";
import { SignupWalletValiadtionSelected } from "./signup-wallet-validation-selected";

interface Props {
  username: string;
  onValid: () => void;
}

export function SignupWalletValidateFunds({ username, onValid }: Props) {
  const { data: wallets } = useQuery<Map<EcencyWalletCurrency, EcencyCreateWalletInformation>>({
    queryKey: ["ecency-wallets", "wallets", username]
  });

  const [selectedWallet, setSelectedWallet] = useState<[EcencyWalletCurrency, string]>();

  const walletsList = useMemo(() => Array.from(wallets?.entries() ?? []), [wallets]);

  return (
    <div className="flex flex-col gap-4 w-full">
      <div>
        <div className="text-lg font-semibold">
          {i18next.t("signup-wallets.validate-funds.title")}
        </div>
        <div className="opacity-50">{i18next.t("signup-wallets.validate-funds.description")}</div>
      </div>
      {!selectedWallet && (
        <div className="grid grid-cols-2 gap-4">
          {walletsList.map(([_, wallet], i) => (
            <SignupWalletValidationItem
              i={i}
              selectable={true}
              key={i}
              currency={wallet.currency}
              address={wallet.address}
              onSelect={() => setSelectedWallet([wallet.currency, wallet.address])}
            />
          ))}
        </div>
      )}
      {selectedWallet && (
        <SignupWalletValiadtionSelected
          walletsList={walletsList}
          selected={selectedWallet}
          onCancel={() => setSelectedWallet(undefined)}
          onValid={onValid}
        />
      )}
    </div>
  );
}
