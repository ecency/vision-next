import { describe, expect, it } from "vitest";
import {
  francToIso1,
  isRtlLang,
  ISO_639_3_TO_1,
  languageDisplayName,
  LIBRETRANSLATE_SOURCES,
  normLang,
  resolveTranslateCta
} from "@/features/shared/entry-translate/iso639";

describe("normLang", () => {
  it("reduces locale tags to a 2-letter code", () => {
    expect(normLang("en-US")).toBe("en");
    expect(normLang("pt_BR")).toBe("pt");
    expect(normLang("ES")).toBe("es");
  });

  it("maps Traditional Chinese variants to LibreTranslate 'zt'", () => {
    expect(normLang("zh-Hant")).toBe("zt");
    expect(normLang("zh-TW")).toBe("zt");
    expect(normLang("zh-HK")).toBe("zt");
    expect(normLang("zh-Hant-TW")).toBe("zt");
  });

  it("keeps Simplified Chinese as 'zh'", () => {
    expect(normLang("zh")).toBe("zh");
    expect(normLang("zh-CN")).toBe("zh");
    expect(normLang("zh-Hans")).toBe("zh");
  });

  it("returns empty string for missing input", () => {
    expect(normLang("")).toBe("");
    expect(normLang(null)).toBe("");
    expect(normLang(undefined)).toBe("");
  });
});

describe("francToIso1", () => {
  it("maps franc's actual ISO-639-3 codes to LibreTranslate ISO-639-1", () => {
    // Regression guards for the codes the design critique flagged.
    expect(francToIso1("pes")).toBe("fa"); // franc emits pes, NOT fas
    expect(francToIso1("arb")).toBe("ar");
    expect(francToIso1("cmn")).toBe("zh");
    expect(francToIso1("zlm")).toBe("ms");
    expect(francToIso1("azj")).toBe("az");
    expect(francToIso1("spa")).toBe("es");
    expect(francToIso1("eng")).toBe("en");
  });

  it("returns null for 'und' and unknown/unsupported codes", () => {
    expect(francToIso1("und")).toBeNull();
    expect(francToIso1("")).toBeNull();
    expect(francToIso1(null)).toBeNull();
    // 'dan' (Danish) is a real franc code but franc-min can't emit it and we
    // don't map it — full-post falls back to server /detect.
    expect(francToIso1("dan")).toBeNull();
  });

  it("every mapped target is a supported LibreTranslate source", () => {
    for (const code1 of Object.values(ISO_639_3_TO_1)) {
      expect(LIBRETRANSLATE_SOURCES.has(code1)).toBe(true);
    }
  });
});

describe("resolveTranslateCta", () => {
  const long = 200;

  it("shows the CTA when content and reader languages differ", () => {
    expect(resolveTranslateCta({ detected: "es", reader: "en", textLength: long })).toEqual({
      show: true,
      source: "es",
      target: "en"
    });
  });

  it("hides the CTA when content is already the reader's language", () => {
    expect(resolveTranslateCta({ detected: "en", reader: "en", textLength: long }).show).toBe(false);
  });

  it("hides the CTA for text below the minimum length", () => {
    expect(resolveTranslateCta({ detected: "es", reader: "en", textLength: 10 }).show).toBe(false);
  });

  it("hides the CTA for undetected / unsupported source languages", () => {
    expect(resolveTranslateCta({ detected: null, reader: "en", textLength: long }).show).toBe(false);
    expect(resolveTranslateCta({ detected: "und", reader: "en", textLength: long }).show).toBe(false);
    // 'xx' is not a LibreTranslate language.
    expect(resolveTranslateCta({ detected: "xx", reader: "en", textLength: long }).show).toBe(false);
  });

  it("falls back to English target when the reader language is unsupported", () => {
    const d = resolveTranslateCta({ detected: "es", reader: "xx", textLength: long });
    expect(d.target).toBe("en");
    expect(d.show).toBe(true);
  });

  it("routes Traditional-Chinese readers to 'zt' target, not 'zh'", () => {
    const d = resolveTranslateCta({ detected: "en", reader: normLang("zh-TW"), textLength: long });
    expect(d.target).toBe("zt");
    expect(d.show).toBe(true);
  });
});

describe("isRtlLang", () => {
  it("flags RTL languages", () => {
    expect(isRtlLang("ar")).toBe(true);
    expect(isRtlLang("he")).toBe(true);
    expect(isRtlLang("fa")).toBe(true);
    expect(isRtlLang("en")).toBe(false);
    expect(isRtlLang("es")).toBe(false);
  });
});

describe("languageDisplayName", () => {
  it("produces readable names, including Traditional Chinese", () => {
    expect(languageDisplayName("es", "en").toLowerCase()).toContain("spanish");
    expect(languageDisplayName("zt", "en").toLowerCase()).toContain("traditional");
  });
});
