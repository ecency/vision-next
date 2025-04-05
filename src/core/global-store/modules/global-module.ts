import Cookies from "js-cookie";
import { AllFilter, ListStyle, Theme } from "@/enums";
import * as ls from "@/utils/local-storage";
import { success } from "@/features/shared";
import i18next from "i18next";
import { getCurrencyRate } from "@/api/misc";
import { currencySymbol, runWithRetries } from "@/utils";

export function createGlobalState() {
  return {
    theme: Cookies.get("theme") || Theme.day,
    listStyle: ListStyle.row,
    intro: true,
    currency: "hbd",
    currencyRate: 1,
    currencySymbol: "$",
    lang: ls.get("lang") || ls.get("current-language") || "en-US",
    searchIndexCount: 0,
    canUseWebp: false,
    hasKeyChain: false,
    newVersion: null,
    globalNotifications: true,
    nsfw: false,
    isMobile: false
  };
}

type State = ReturnType<typeof createGlobalState>;

export function createGlobalActions(set: (state: Partial<State>) => void, getState: () => State) {
  return {
    toggleTheme: (theme_key?: Theme) => {
      const { theme, isMobile } = getState();
      let newTheme: any = theme === Theme.day ? Theme.night : Theme.day;

      if (!!theme_key) {
        newTheme = theme_key;
      }

      const use_system = ls.get("use_system_theme", false);
      if (use_system) {
        newTheme =
          window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
            ? Theme.night
            : Theme.day;
      }

      ls.set("theme", newTheme);
      Cookies.set("theme", newTheme, { expires: 365 });

      set({
        theme: newTheme
      });
      let body: any = document.getElementsByTagName("body");
      if (!body) return;
      body = body[0];
      if (theme === "night") {
        body.classList.remove("dark");
      } else {
        body.classList.add("dark");
      }
    },
    setLang: async (lang: string) => {
      ls.set("lang", lang);
      ls.set("current-language", lang);
      await i18next.changeLanguage(lang);
      set({
        lang: lang ?? "en-US"
      });
    },
    setListStyle: (listStyle: ListStyle) => {
      set({
        listStyle
      });
    },
    async setCurrency(currency: string) {
      const rate = await getCurrencyRate(currency);
      const symbol = currencySymbol(currency);
      set({
        currency,
        currencyRate: rate,
        currencySymbol: symbol
      });
      success(i18next.t("preferences.updated"));
    },
    setNsfw(value: string) {
      set({
        nsfw: Boolean(Number(value))
      });
      success(i18next.t("preferences.updated"));
    },
    initKeychain() {
      // Keychain won't be ready immediately after script running
      // So We have to wait until full window load and then drop our task to macro-queue
      // It will help us to validate that all sync and async operations have finished
      // Including browser extensions
      runWithRetries(() => {
        if (typeof window !== "undefined" && "hive_keychain" in window) {
          (window as unknown as any).hive_keychain.requestHandshake(() =>
            set({ hasKeyChain: true })
          );
          return true;
        }
        return false;
      });
    }
  };
}
