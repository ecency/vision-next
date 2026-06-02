"use client";

import Image from "next/image";
import i18next from "i18next";
import { UilArrowRight } from "@tooni/iconscout-unicons-react";

/**
 * The set of supported Hive browser extensions with their Chrome Web Store
 * install links. Shared by the login dialog and the auth-upgrade (signing)
 * dialog so the "you don't have an extension — install one" guidance stays in
 * one place. Keeper is highlighted as the recommended (Ecency) option.
 */
const EXTENSIONS = [
  {
    href: "https://chromewebstore.google.com/detail/hive-keeper/eehlplhgiofbbanbjiodipefljadfehe",
    icon: "/assets/keeper.svg",
    alt: "Hive Keeper",
    nameKey: "login.extension-keeper-name",
    descKey: "login.extension-keeper-desc",
    highlight: true
  },
  {
    href: "https://chromewebstore.google.com/detail/hive-keychain/jcacnejopjdphbnjgfaaobbfafkihpep",
    icon: "/assets/keychain.png",
    alt: "Keychain",
    nameKey: "login.extension-keychain-name",
    descKey: "login.extension-keychain-desc",
    highlight: false
  },
  {
    href: "https://chromewebstore.google.com/detail/peak-vault/mcocapccicdidkhhghnopbddglkpjcoi",
    icon: "/assets/peakvault.svg",
    alt: "Peak Vault",
    nameKey: "login.extension-peakvault-name",
    descKey: "login.extension-peakvault-desc",
    highlight: false
  }
] as const;

/**
 * Renders the list of installable Hive browser extensions as store links.
 */
export function ExtensionInstallList() {
  return (
    <div className="flex flex-col gap-3">
      {EXTENSIONS.map((ext) => (
        <a
          key={ext.alt}
          href={ext.href}
          target="_blank"
          rel="noopener noreferrer"
          className={
            ext.highlight
              ? "flex items-center gap-3 p-3 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
              : "flex items-center gap-3 p-3 rounded-lg border border-[--border-color] hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          }
        >
          <Image width={32} height={32} src={ext.icon} alt={ext.alt} className="w-8 h-8" />
          <div className="flex-1">
            <div className="font-semibold text-sm">{i18next.t(ext.nameKey)}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{i18next.t(ext.descKey)}</div>
          </div>
          <UilArrowRight
            className={ext.highlight ? "w-4 h-4 text-blue-500" : "w-4 h-4 opacity-50"}
          />
        </a>
      ))}
    </div>
  );
}
