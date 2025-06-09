import { Button, StyledTooltip } from "@/features/ui";
import { UilMoneyStack } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import Image from "next/image";
import { PerksBasicCard } from "./perks-basic-card";

export function PerksPointsSpinBanner() {
  return (
    <PerksBasicCard className="p-4 flex flex-col md:flex-row items-center gap-4 md:hover:!rotate-0 cursor-pointer">
      <Image src="/assets/undraw-gifts.svg" width={240} height={120} alt="" />
      <div className="flex flex-col gap-4 md:gap-6">
        <div>
          <div className="md:text-lg font-bold">{i18next.t("perks.spin-title")}</div>
          <div className="text-sm md:text-base text-gray-600 dark:text-gray-400">
            {i18next.t("perks.spin-description")}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button size="lg" icon={<UilMoneyStack />}>
            {i18next.t("perks.spin-now")}
          </Button>
          <StyledTooltip content="Available soon">
            <Button appearance="gray" size="lg" disabled={true}>
              {i18next.t("perks.want-more-spins")}
            </Button>
          </StyledTooltip>
        </div>
      </div>
    </PerksBasicCard>
  );
}
