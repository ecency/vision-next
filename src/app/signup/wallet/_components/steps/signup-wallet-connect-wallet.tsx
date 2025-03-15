import { EcencyWalletCurrency } from "@ecency/wallets";
import { AnimatePresence } from "framer-motion";
import i18next from "i18next";
import { SignupExternalWalletInformation } from "../../types";
import { SignupWalletConnectWalletItem } from "./signup-wallet-connect-wallet-item";

const CURRENCIES = [
  EcencyWalletCurrency.BTC,
  EcencyWalletCurrency.ETH,
  EcencyWalletCurrency.ATOM,
  EcencyWalletCurrency.TRON
];

interface Props {
  username: string;
  wallets: Record<EcencyWalletCurrency, SignupExternalWalletInformation>;
  onSuccess: (
    currency: EcencyWalletCurrency,
    walletInformation: SignupExternalWalletInformation
  ) => void;
  onClear: (currency: EcencyWalletCurrency) => void;
}

export function SignupWalletConnectWallet({ wallets, username, onSuccess, onClear }: Props) {
  return (
    <div className="flex flex-col gap-4 w-full">
      <div>
        <div className="text-lg font-semibold">{i18next.t("signup-wallets.wallets.title")}</div>
        <div className="opacity-50">{i18next.t("signup-wallets.wallets.description")}</div>
      </div>
      <div className="grid grid-cols-2 gap-4 mt-4">
        <AnimatePresence>
          {CURRENCIES.map((currency, index) => (
            <SignupWalletConnectWalletItem
              onClear={() => onClear(currency)}
              hasSelected={currency in wallets}
              i={index}
              onSuccess={(info) => onSuccess(currency, info)}
              currency={currency}
              username={username}
              key={currency}
            />
          ))}
        </AnimatePresence>
      </div>
      <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        {i18next.t("signup-wallets.wallets.hint")}
      </div>
    </div>
  );
}
