import { Alert } from "@/features/ui";
import { UilLock } from "@tooni/iconscout-unicons-react";
import { SignupWalletConnectWalletItem } from "./signup-wallet-connect-wallet-item";
import { SignupExternalWalletInformation } from "../../types";
import { AnimatePresence } from "framer-motion";
import { EcencyWalletCurrency } from "@ecency/wallets";

const CURRENCIES = Object.values(EcencyWalletCurrency);

interface Props {
  username: string;
  onSuccess: (
    currency: EcencyWalletCurrency,
    walletInformation: SignupExternalWalletInformation
  ) => void;
}

export function SignupWalletConnectWallet({ username, onSuccess }: Props) {
  return (
    <div className="flex flex-col gap-4 w-full">
      <div>
        <div className="text-lg font-semibold">Create one or multiple wallets</div>
        <div className="opacity-50">
          Newly created or imported wallets will be assigned to your new Hive account
        </div>
      </div>
      <Alert appearance="warning" className="mb-4">
        <UilLock className="mr-1" />
        Keep in mind, Hive will assign public keys only to your new Hive account. Private keys will
        be show only once. Keep them in a safety place or a paper!
      </Alert>
      <AnimatePresence>
        {CURRENCIES.map((currency, index) => (
          <SignupWalletConnectWalletItem
            i={index}
            onSuccess={(info) => onSuccess(currency, info)}
            currency={currency}
            username={username}
            key={currency}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
