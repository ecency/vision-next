import { Feedback, Navbar } from "@/features/shared";
import { PropsWithChildren } from "react";
import { PerkListItem, PerksHeader } from "./components";
import i18next from "i18next";
import {
  UilChartBar,
  UilGraphBar,
  UilMoneyInsert,
  UilRocket
} from "@tooni/iconscout-unicons-react";

export default function Layout({ children }: PropsWithChildren) {
  return (
    <div className="bg-blue-duck-egg dark:bg-transparent pt-[63px] md:pt-[69px] min-h-[100vh] pb-16">
      <Feedback />
      <Navbar experimental={true} />
      <div className="container mx-auto">
        <PerksHeader />
        {/* <div className="bg-white border border-[--border-color] rounded-xl grid grid-cols-12 overflow-hidden">
          <div className="col-span-12 sm:col-span-6 md:col-span-4 flex flex-col">
            <PerkListItem
              icon={<UilMoneyInsert className="text-blue-dark-sky" />}
              title={i18next.t("perks.points-title")}
              description={i18next.t("perks.points-description")}
            />
            <PerkListItem
              icon={<UilRocket className="text-green" />}
              title={i18next.t("perks.account-boost-title")}
              description={i18next.t("perks.account-boost-description")}
            />
            <PerkListItem
              icon={<UilChartBar className="text-red" />}
              title={i18next.t("perks.promote-title")}
              description={i18next.t("perks.promote-description")}
            />
          </div>
          <div className="col-span-12 sm:col-span-6 md:col-span-8 border-l border-[--border-color]">
            {children}
          </div>
        </div> */}
        {children}
      </div>
    </div>
  );
}
