import i18next from "i18next";
import { PromoteFrame } from "../_frames";
import { Button } from "@/features/ui";
import Link from "next/link";

export function PerksPromoteCard() {
  return (
    <div className="bg-white dark:bg-gray-900 w-full h-full rounded-xl p-2 md:p-4 lg:p-6">
      <PromoteFrame />
      <div className="font-semibold text-lg mt-6 md:mt-8">{i18next.t("perks.promote-title")}</div>
      <div className="text-sm  md:text-base text-gray-600 dark:text-gray-400 mb-2 md:mb-4">
        {i18next.t("perks.promote-description")}
      </div>
      <Link href="/perks/promote-post">
        <Button>{i18next.t("perks.promote-action")}</Button>
      </Link>
    </div>
  );
}
