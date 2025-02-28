import { ExternalWalletCurrency } from "@/enums";
import { Badge } from "@/features/ui";
import Image from "next/image";

const CURRENCIES = Object.keys(ExternalWalletCurrency);

export function SignupWalletIntro() {
  return (
    <div className="flex items-center gap-6 lg:pb-4 xl:pb-6">
      <div className="mx-auto md:min-w-[240px] flex justify-center">
        <Image src="/assets/whale-auth.svg" alt="" width={200} height={200} />
      </div>
      <div>
        <div>
          <div className="font-bold text-xl">Create a Hive account</div>
          <div className="opacity-50 mb-4">
            Create or import wallets, topup minimum amount of money, get your free account.
          </div>
          <div>You can easily setup new account using one of these currencies.</div>
        </div>
        <div className="flex items-center gap-2 mt-6 flex-wrap">
          {CURRENCIES.map((currency) => (
            <Badge key={currency}>{currency}</Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
