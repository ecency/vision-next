import { Badge } from "@/features/ui";
import { EcencyWalletCurrency } from "@ecency/wallets";
import Image from "next/image";
import { SignupWalletChooseUsername } from "./signup-wallet-choose-username";
import i18next from "i18next";

const CURRENCIES = Object.keys(EcencyWalletCurrency);

interface Props {
  initialUsername: string;
  setUsername: (value: string) => void;
}

export function SignupWalletIntro({ setUsername, initialUsername }: Props) {
  return (
    <div className="flex flex-col gap-6 lg:pb-4 xl:pb-6">
      <div>
        <div className="font-bold text-xl">{i18next.t("signup-wallets.intro.title")}</div>
        <div className="opacity-50 mb-4">{i18next.t("signup-wallets.intro.description")}</div>
      </div>

      <div>
        <div className="mb-2">{i18next.t("signup-wallets.intro.currencies-info")}</div>
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {CURRENCIES.map((currency) => (
            <Badge key={currency}>{currency}</Badge>
          ))}
        </div>
        <SignupWalletChooseUsername
          initialUsername={initialUsername}
          onAvailableUsername={setUsername}
        />
      </div>
    </div>
  );
}
