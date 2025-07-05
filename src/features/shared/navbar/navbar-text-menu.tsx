"use client";

import React, { Fragment } from "react";
import Link from "next/link";
import i18next from "i18next";
import i18n from "i18next";
import { EcencyConfigManager } from "@/config";
import { usePathname } from "next/navigation";
import { classNameObject } from "@ui/util";

export function NavbarTextMenu() {
  const pathname = usePathname();

  const ITEMS = [
    {
      link: "/discover",
      label: i18next.t("navbar.discover"),
      show: true
    },
    {
      link: "/waves",
      label: i18n.t("navbar.waves"),
      show: EcencyConfigManager.selector(({ visionFeatures }) => visionFeatures.waves.enabled)
    },
    {
      link: "/decks",
      label: i18next.t("navbar.decks"),
      show: EcencyConfigManager.selector(({ visionFeatures }) => visionFeatures.decks.enabled)
    }
  ];

  return (
    <div className="hidden sm:flex md:hidden xl:flex text-menu items-center gap-4 justify-center h-full md:mr-2">
      {ITEMS.map((item, i) => (
        <Fragment key={i}>
          <Link
            key={item.link}
            className={classNameObject({
              "text-sm font-semibold duration-300 hover:opacity-75 mt-0 px-2 py-0.5 rounded-2xl":
                true,
              "text-gunmetal dark:text-white": !pathname?.includes(item.link),
              "bg-blue-duck-egg text-blue-dark-sky dark:bg-dark-default": pathname?.includes(
                item.link
              )
            })}
            href={item.link}
          >
            {item.label}
          </Link>
          {i !== ITEMS.length - 1 && (
            <i
              key={"circle" + item.label}
              className="w-2 h-2 bg-gray-200 dark:bg-dark-default rounded-full"
            />
          )}
        </Fragment>
      ))}
    </div>
  );
}
