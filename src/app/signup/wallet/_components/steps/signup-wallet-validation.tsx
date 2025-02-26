import { ExternalWalletCurrency } from "@/enums";
import { AnimatePresence } from "framer-motion";
import { useMemo, useState } from "react";
import { SignupExternalWalletInformation } from "../../types";
import { SignupWalletValidationItem } from "./signup-wallet-validation-item";
import { SignupWalletValiadtionSelected } from "./signup-wallet-validation-selected";

interface Props {
  wallets: Record<ExternalWalletCurrency, SignupExternalWalletInformation>;
  onValidated: () => void;
}

export function SignupWalletValidation({ wallets, onValidated }: Props) {
  // Currency and address
  const [selected, setSelected] = useState<[ExternalWalletCurrency, string]>();

  const walletsList = useMemo(() => Object.entries(wallets), [wallets]);

  return (
    <div className="flex flex-col gap-4 w-full">
      <div>
        <div className="text-lg font-semibold">Validate funds</div>
        <div className="opacity-50">
          Topup one of your wallets to make us sure that You are real person
        </div>
      </div>
      <AnimatePresence>
        {!selected && (
          <div className="grid grid-cols-2 sm:grid-col-3 md:grid-cols-4 mt-4 sm:mt-6 lg:mt-8 xl:mt-12 gap-4">
            {walletsList.map(([currency, { address }], index) => (
              <SignupWalletValidationItem
                i={index}
                key={address}
                currency={currency as ExternalWalletCurrency}
                address={address}
                selectable={true}
                onSelect={() => setSelected([currency as ExternalWalletCurrency, address])}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selected && (
          <SignupWalletValiadtionSelected
            selected={selected}
            walletsList={walletsList}
            onCancel={() => setSelected(undefined)}
            onValid={onValidated}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
