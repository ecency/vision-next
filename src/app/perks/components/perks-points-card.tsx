import { Button } from "@/features/ui";
import { UilArrowRight } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";

export function PerksPointsCard() {
  return (
    <div className="bg-blue-dark-sky w-full h-full rounded-xl">
      <div className="flex items-start justify-between gap-2 p-2 md:p-4 lg:p-6">
        <div className="text-[#ffffff] text-xl font-bold">{i18next.t("perks.points-title")}</div>
        <Button size="xs" appearance="white" icon={<UilArrowRight />} />
      </div>
    </div>
  );
}
