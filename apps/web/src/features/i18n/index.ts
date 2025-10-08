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
    code: "hi-IN",
    name: "हिन्दी"
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
    code: "sr-CS",
    name: "Srpski"
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

const enUs = require("./locales/en-US.json");
const esES = require("./locales/es-ES.json");
const hiIN = require("./locales/hi-IN.json");
const itIT = require("./locales/it-IT.json");
const idID = require("./locales/id-ID.json");
const ptPT = require("./locales/pt-PT.json");
const srCS = require("./locales/sr-CS.json");
const ukUA = require("./locales/uk-UA.json");
const bgBG = require("./locales/bg-BG.json");
const ruRU = require("./locales/ru-RU.json");
const uzUZ = require("./locales/uz-UZ.json");
const zhCN = require("./locales/zh-CN.json");

export async function initI18next() {
  const resources = {
    ["en-US"]: {
      translation: enUs
    },
    ["es-ES"]: {
      translation: esES
    },
    ["hi-IN"]: {
      translation: hiIN
    },
    ["it-IT"]: {
      translation: itIT
    },
    ["id-ID"]: {
      translation: idID
    },
    ["pt-PT"]: {
      translation: ptPT
    },
    ["sr-CS"]: {
      translation: srCS
    },
    ["uk-UA"]: {
      translation: ukUA
    },
    ["bg-BG"]: {
      translation: bgBG
    },
    ["ru-RU"]: {
      translation: ruRU
    },
    ["uz-UZ"]: {
      translation: uzUZ
    },
    ["zh-CN"]: {
      translation: zhCN
    }
  };

  await i18n.init({
    resources,
    fallbackLng: "en-US",
    interpolation: {
      escapeValue: false
    }
  });

  await i18next.changeLanguage(ls.get("lang") || ls.get("current-language"));

  i18n.on("languageChanged", function (lang) {
    dayjs.locale(lang);
  });
}

initI18next();

export * from "./navigation-locale-watcher";
