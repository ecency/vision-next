// @vitest-environment node
import { describe, it, expect } from "vitest";

import { parseSpeakSource, isPrivateIP, parseRange } from "@/app/api/speak-audio/route";

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

  it("rejects a host-mimicking path (not under /liketu/, no override possible)", () => {
    // pathname //evil.com/... is not a /liketu/ path so it's rejected; and even if
    // it weren't, fetchAudio fetches the validated URL whose host stays cdn.liketu.com.
    expect(reject("https://cdn.liketu.com//evil.com/clip.webm").code).toBe("UNSUPPORTED_PATH");
  });

  it("rejects an audio file outside the /liketu/ media root", () => {
    expect(reject("https://cdn.liketu.com/other/clip.webm").code).toBe("UNSUPPORTED_PATH");
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

describe("isPrivateIP", () => {
  it.each([
    "10.0.0.1",
    "127.0.0.1",
    "192.168.1.1",
    "172.16.0.1",
    "169.254.0.1",
    "100.64.0.1", // CGNAT
    "198.18.0.1", // benchmarking
    "192.0.2.5", // TEST-NET-1
    "203.0.113.9", // TEST-NET-3
    "::1",
    "fe80::1",
    "fc00::1",
    "2001:db8::1",
    "::ffff:10.0.0.1", // IPv4-mapped (dotted)
    "::ffff:0a00:0001" // IPv4-mapped (hex) == 10.0.0.1 — the gap a reviewer flagged
  ])("flags %s as private/reserved", (ip) => {
    expect(isPrivateIP(ip)).toBe(true);
  });

  it.each(["8.8.8.8", "1.1.1.1", "138.199.37.232", "2606:4700:4700::1111"])(
    "treats public %s as public",
    (ip) => {
      expect(isPrivateIP(ip)).toBe(false);
    }
  );

  it("treats an unparseable address as unsafe", () => {
    expect(isPrivateIP("not-an-ip")).toBe(true);
  });
});

describe("parseRange", () => {
  const SIZE = 1000;
  it("returns null when there is no range header or no honourable range", () => {
    expect(parseRange(null, SIZE)).toBeNull();
    expect(parseRange("bytes=abc", SIZE)).toBeNull();
    expect(parseRange("bytes=-", SIZE)).toBeNull();
  });

  it("parses a closed range", () => {
    expect(parseRange("bytes=0-99", SIZE)).toEqual({ start: 0, end: 99 });
  });

  it("parses an open-ended range to the last byte", () => {
    expect(parseRange("bytes=500-", SIZE)).toEqual({ start: 500, end: 999 });
  });

  it("parses a suffix range as the final N bytes", () => {
    expect(parseRange("bytes=-200", SIZE)).toEqual({ start: 800, end: 999 });
    // suffix larger than the file clamps to the whole file
    expect(parseRange("bytes=-5000", SIZE)).toEqual({ start: 0, end: 999 });
  });

  it("clamps an end past EOF", () => {
    expect(parseRange("bytes=900-9999", SIZE)).toEqual({ start: 900, end: 999 });
  });

  it("reports out-of-range as unsatisfiable", () => {
    expect(parseRange("bytes=1000-1100", SIZE)).toBe("unsatisfiable");
    expect(parseRange("bytes=50-10", SIZE)).toBe("unsatisfiable");
  });
});
