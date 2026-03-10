import i18n from "i18next";
import i18next from "i18next";

import dayjs from "@/utils/dayjs";
import * as ls from "@/utils/local-storage";

export const langOptions = [
  {
    code: "en-US",
    name: "English"
  },
  {
    code: "es-ES",
    name: "Español"
  },
  {
    code: "fr-FR",
    name: "Français"
  },
  {
    code: "de-DE",
    name: "Deutsch"
  },
  {
    code: "hi-IN",
    name: "हिन्दी"
  },
  {
    code: "ja-JP",
    name: "日本語"
  },
  {
    code: "it-IT",
    name: "Italiano"
  },
  {
    code: "id-ID",
    name: "Bahasa Indonesia"
  },
  {
    code: "pt-PT",
    name: "Português"
  },
  {
    code: "nl-NL",
    name: "Nederlands"
  },
  {
    code: "sr-CS",
    name: "Srpski"
  },
  {
    code: "pl-PL",
    name: "Polski"
  },
  {
    code: "uk-UA",
    name: "Українська"
  },
  {
    code: "bg-BG",
    name: "Български"
  },
  {
    code: "ru-RU",
    name: "Русский"
  },
  {
    code: "uz-UZ",
    name: "O'zbekcha"
  },
  {
    code: "zh-CN",
    name: "简体字"
  }
];

// Only bundle en-US; all other locales are loaded on demand
const enUs = require("./locales/en-US.json");

const localeLoaders: Record<string, () => Promise<any>> = {
  "es-ES": () => import("./locales/es-ES.json"),
  "fr-FR": () => import("./locales/fr-FR.json"),
  "de-DE": () => import("./locales/de-DE.json"),
  "hi-IN": () => import("./locales/hi-IN.json"),
  "ja-JP": () => import("./locales/ja-JP.json"),
  "it-IT": () => import("./locales/it-IT.json"),
  "id-ID": () => import("./locales/id-ID.json"),
  "pt-PT": () => import("./locales/pt-PT.json"),
  "nl-NL": () => import("./locales/nl-NL.json"),
  "sr-CS": () => import("./locales/sr-CS.json"),
  "pl-PL": () => import("./locales/pl-PL.json"),
  "uk-UA": () => import("./locales/uk-UA.json"),
  "bg-BG": () => import("./locales/bg-BG.json"),
  "ru-RU": () => import("./locales/ru-RU.json"),
  "uz-UZ": () => import("./locales/uz-UZ.json"),
  "zh-CN": () => import("./locales/zh-CN.json")
};

export async function loadLocale(lang: string) {
  if (lang === "en-US" || !localeLoaders[lang]) return;
  if (i18n.hasResourceBundle(lang, "translation")) return;

  const module = await localeLoaders[lang]();
  i18n.addResourceBundle(lang, "translation", module.default || module);
}

export async function initI18next() {
  await i18n.init({
    resources: {
      ["en-US"]: {
        translation: enUs
      }
    },
    fallbackLng: "en-US",
    interpolation: {
      escapeValue: false
    }
  });

  // Load the user's preferred locale on demand
  const userLang = ls.get("lang") || ls.get("current-language");
  if (userLang && userLang !== "en-US") {
    await loadLocale(userLang);
  }
  await i18next.changeLanguage(userLang || "en-US");

  i18n.on("languageChanged", async function (lang) {
    await loadLocale(lang);
    dayjs.locale(lang);
  });
}

initI18next();

export * from "./navigation-locale-watcher";
