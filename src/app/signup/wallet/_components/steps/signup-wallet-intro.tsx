import { Badge, Button } from "@/features/ui";
import Image from "next/image";
import { SignupWalletCurrency } from "../../_enums";

const CURRENCIES = Object.keys(SignupWalletCurrency);

interface Props {
  onNext: () => void;
}

export function SignupWalletIntro({ onNext }: Props) {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <Image
        src="/assets/logo-circle.svg"
        className="logo relative min-w-[40px] max-w-[40px]"
        alt="Logo"
        width={40}
        height={40}
      />
      <div className="font-bold text-xl">Welcome to Ecency</div>
      <div>You can easily setup new account using one of these currencies</div>
      <div className="flex items-center gap-2 flex-wrap">
        {CURRENCIES.map((currency) => (
          <Badge key={currency}>{currency}</Badge>
        ))}
      </div>
      <Button size="lg" className="min-w-[256px] mt-12" onClick={onNext}>
        Let&apos;s start!
      </Button>
    </div>
  );
}
