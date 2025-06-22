import { Button } from "@/features/ui";
import { UilArrowRight } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import { GetPointsFrame } from "../_frames";
import Link from "next/link";

export function PerksPointsCard() {
  return (
    <Link className="block w-full h-full" href="/perks/points">
      <div className="bg-blue-dark-sky w-full h-full flex flex-col justify-between rounded-xl overflow-hidden duration-300 md:hover:rotate-1">
        <div className="flex items-start justify-between gap-2 p-4 lg:p-6">
          <div>
            <div className="text-[#ffffff] text-xl font-bold">
              {i18next.t("perks.points-title")}
            </div>
            <div className="text-[#ffffff]">{i18next.t("perks.points-title-2")}</div>
          </div>
          <Button size="xs" appearance="white" icon={<UilArrowRight />} />
        </div>

        <GetPointsFrame />
      </div>
    </Link>
  );
}
