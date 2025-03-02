import { Badge } from "@/features/ui";
import { EcencyWalletCurrency } from "@ecency/wallets";
import Image from "next/image";
import { SignupWalletChooseUsername } from "./signup-wallet-choose-username";

const CURRENCIES = Object.keys(EcencyWalletCurrency);

interface Props {
  initialUsername: string;
  setUsername: (value: string) => void;
}

export function SignupWalletIntro({ setUsername, initialUsername }: Props) {
  return (
    <div className="flex flex-col gap-6 lg:pb-4 xl:pb-6">
      <div>
        <div className="font-bold text-xl">Signup by external wallets</div>
        <div className="opacity-50 mb-4">
          Create or import wallets, topup minimum amount of money, get your free account
        </div>
      </div>

      <div className="flex flex-col md:flex-row">
        <div className="mx-auto md:min-w-[240px] flex justify-center">
          <Image src="/assets/undraw-social-post.svg" alt="" width={200} height={200} />
        </div>
        <div>
          <div className="mb-2">
            You can easily setup new account using one of these currencies.
          </div>
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
    </div>
  );
}
