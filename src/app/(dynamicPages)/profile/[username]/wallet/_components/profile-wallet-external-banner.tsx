import { Button } from "@/features/ui";
import { UilArrowRight } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import Image from "next/image";

export function ProfileWalletExternalBanner() {
  return (
    <div className="bg-white rounded-xl p-3 mb-4 flex items-center gap-4 lg:gap-6">
      <Image src="/assets/undraw-digital-currency.svg" alt="" width={300} height={300} />
      <div className="flex flex-col items-start gap-2 lg:gap-4">
        <h3 className="text-2xl">{i18next.t("profile-wallet.external-wallets-offer.title")}</h3>
        <div className="opacity-75">
          {i18next.t("profile-wallet.external-wallets-offer.description")}
        </div>
        <Button disabled={true} size="lg" icon={<UilArrowRight />}>
          {i18next.t("waves.promote.coming-soon")}
        </Button>
      </div>
    </div>
  );
}
