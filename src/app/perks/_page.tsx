"use client";

import i18next from "i18next";
import { PerksPointsCard, PerksPromoteCard } from "./components";

export function PerksPage() {
  return (
    <div className="grid grid-cols-12 grid-rows-4 gap-4">
      <div className="col-span-12 sm:col-span-6 row-span-4 md:col-span-5">
        <PerksPointsCard />
      </div>
      <div className="col-span-12 sm:col-span-6 row-span-4 md:col-span-4">
        <PerksPromoteCard />
      </div>
      <div className="col-span-12 sm:col-span-6 row-span-2 md:col-span-3">
        <div className="bg-white dark:bg-gray-900 w-full h-full rounded-xl">
          <div>{i18next.t("perks.account-boost-title")}</div>
        </div>
      </div>
      <div className="col-span-12 sm:col-span-6 row-span-2 md:col-span-3">
        <div className="bg-white dark:bg-gray-900 w-full h-full rounded-xl">Promote post</div>
      </div>
    </div>
  );
}
