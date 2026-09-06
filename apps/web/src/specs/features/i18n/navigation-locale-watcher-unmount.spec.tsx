import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import * as ls from "@/utils/local-storage";

let mockSearchParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useSearchParams: vi.fn(() => mockSearchParams)
}));

// The global setup stub of i18next has `on` but no `off`; the watcher calls
// both, so this spec needs a complete stub.
vi.mock("i18next", () => ({
  __esModule: true,
  default: {
    t: vi.fn((key: string) => key),
    language: "en-US",
    init: vi.fn(),
    changeLanguage: vi.fn(async () => undefined),
    on: vi.fn(),
    off: vi.fn()
  }
}));

let mockLang = "en-US";
// Mirrors the synchronous part of the real setLang (global-module.ts): both
// storage keys are written before anything is awaited. Case (c) relies on
// this to pin the effect order the unmount restore depends on.
const mockSetLang = vi.fn((lang: string) => {
  ls.set("lang", lang);
  ls.set("current-language", lang);
});
vi.mock("@/core/global-store", () => ({
  useGlobalStore: vi.fn((selector: (state: any) => any) =>
    selector({ lang: mockLang, setLang: mockSetLang })
  )
}));

import { NavigationLocaleWatcherClient } from "@/features/i18n/navigation-locale-watcher-client";
import i18next from "i18next";

/*
  The watcher is mounted by the FAQ page and re-applies the stored language
  when it unmounts so a ?lang=xx visit does not stick. A visitor whose
  language was never persisted has no stored key. The old unconditional
  restore pushed null through setLang into setDayjsLocale, which threw on
  lang.toLowerCase() as an unhandled rejection (ECENCY-NEXT-1GPC, 1GPY).
*/
describe("NavigationLocaleWatcherClient unmount restore", () => {
  beforeEach(() => {
    localStorage.clear();
    mockSetLang.mockClear();
    mockSearchParams = new URLSearchParams();
    mockLang = "en-US";
  });

  it("no ?lang and no stored language: unmount does not call setLang (ECENCY-NEXT-1GPC, 1GPY)", () => {
    const { unmount } = render(<NavigationLocaleWatcherClient />);
    expect(mockSetLang).not.toHaveBeenCalled();
    unmount();
    expect(mockSetLang).not.toHaveBeenCalled();
    expect(i18next.off).toHaveBeenCalledWith("languageChanged", expect.any(Function));
  });

  it("no ?lang with a stored language: unmount re-applies it", () => {
    localStorage.setItem("ecency_current-language", JSON.stringify("es-ES"));
    mockLang = "es-ES";
    const { unmount } = render(<NavigationLocaleWatcherClient />);
    expect(mockSetLang).not.toHaveBeenCalled();
    unmount();
    expect(mockSetLang).toHaveBeenCalledTimes(1);
    expect(mockSetLang).toHaveBeenCalledWith("es-ES");
  });

  it("?lang=es on an en-US visitor: switches on mount and restores en-US on unmount", () => {
    mockSearchParams = new URLSearchParams({ lang: "es" });
    const { unmount } = render(<NavigationLocaleWatcherClient />);
    expect(mockSetLang).toHaveBeenCalledWith("es-ES");
    // setLang already wrote es-ES into current-language; useMount must run
    // after that effect so the original language is what the restore reads.
    expect(JSON.parse(localStorage.getItem("ecency_current-language") as string)).toBe("en-US");
    mockSetLang.mockClear();
    unmount();
    expect(mockSetLang).toHaveBeenCalledTimes(1);
    expect(mockSetLang).toHaveBeenCalledWith("en-US");
  });

  it("a stored JSON null left by the old crash is treated as unset", () => {
    // The crash path stringified null into the key before throwing.
    localStorage.setItem("ecency_current-language", "null");
    const { unmount } = render(<NavigationLocaleWatcherClient />);
    unmount();
    expect(mockSetLang).not.toHaveBeenCalled();
  });
});
