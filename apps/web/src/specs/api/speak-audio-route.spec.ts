// @vitest-environment node
import { describe, it, expect } from "vitest";

import { parseSpeakSource } from "@/app/api/speak-audio/route";

const LIKETU =
  "https://cdn.liketu.com/liketu/speak/erilej/re-liketu-speak-x/1781649490185-abc.webm";

// Helper: capture the CodedError shape ({ code, status }) without exporting the class.
function reject(src: unknown): { code: string; status: number } {
  try {
    parseSpeakSource(src);
  } catch (e) {
    return e as { code: string; status: number };
  }
  throw new Error("expected parseSpeakSource to throw");
}

describe("parseSpeakSource", () => {
  it("accepts a valid cdn.liketu.com audio url", () => {
    const url = parseSpeakSource(LIKETU);
    expect(url.hostname).toBe("cdn.liketu.com");
    expect(url.protocol).toBe("https:");
  });

  it.each(["webm", "mp3", "m4a", "ogg", "wav"])("accepts the .%s extension", (ext) => {
    const url = parseSpeakSource(`https://cdn.liketu.com/liketu/speak/x/clip.${ext}`);
    expect(url.pathname.endsWith(`.${ext}`)).toBe(true);
  });

  it("rejects a missing src", () => {
    expect(reject(undefined).code).toBe("MISSING_SRC");
    expect(reject("").code).toBe("MISSING_SRC");
    expect(reject(123 as unknown).code).toBe("MISSING_SRC");
  });

  it("rejects a malformed url", () => {
    expect(reject("not a url").code).toBe("INVALID_SRC");
  });

  it("rejects non-https schemes", () => {
    expect(reject("http://cdn.liketu.com/x/clip.webm").code).toBe("INVALID_SRC");
  });

  it("rejects any host that is not exactly cdn.liketu.com", () => {
    expect(reject("https://evil.com/x/clip.webm").code).toBe("HOST_NOT_ALLOWED");
    // suffix-spoof: a real attacker domain that ends with the allowed host as a label
    expect(reject("https://cdn.liketu.com.evil.tld/x/clip.webm").code).toBe("HOST_NOT_ALLOWED");
    // subdomain of the CDN is not the exact allowlisted host
    expect(reject("https://evil.cdn.liketu.com/x/clip.webm").code).toBe("HOST_NOT_ALLOWED");
  });

  it("rejects an explicit non-default port on the allowed host", () => {
    expect(reject("https://cdn.liketu.com:8080/x/clip.webm").code).toBe("HOST_NOT_ALLOWED");
  });

  it("rejects an unsupported / missing extension", () => {
    expect(reject("https://cdn.liketu.com/x/clip.txt").code).toBe("UNSUPPORTED_EXT");
    expect(reject("https://cdn.liketu.com/x/clip").code).toBe("UNSUPPORTED_EXT");
  });

  it("validation errors carry a 4xx status", () => {
    expect(reject(undefined).status).toBe(400);
    expect(reject("https://evil.com/x/clip.webm").status).toBe(400);
  });
});
