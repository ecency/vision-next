import { describe, it, expect } from "vitest";
import { parseEntryUrl } from "@/app/api/oembed/parse-entry-url";

describe("parseEntryUrl", () => {
  it("parses the bare /@author/permlink form", () => {
    expect(parseEntryUrl("https://ecency.com/@alice/my-post")).toEqual({
      author: "alice",
      permlink: "my-post"
    });
  });

  it("parses the legacy /category/@author/permlink form", () => {
    expect(parseEntryUrl("https://ecency.com/hive-163399/@alice/my-post")).toEqual({
      author: "alice",
      permlink: "my-post"
    });
  });

  it("ignores query string and hash", () => {
    expect(parseEntryUrl("https://ecency.com/@alice/my-post?referral=bob#comments")).toEqual({
      author: "alice",
      permlink: "my-post"
    });
  });

  it("accepts subdomains of ecency.com", () => {
    expect(parseEntryUrl("https://www.ecency.com/@alice/my-post")).toEqual({
      author: "alice",
      permlink: "my-post"
    });
  });

  it("decodes percent-encoded segments (e.g. %40 author)", () => {
    expect(parseEntryUrl("https://ecency.com/%40alice/my-post")).toEqual({
      author: "alice",
      permlink: "my-post"
    });
  });

  it("rejects non-ecency hosts, including look-alikes", () => {
    expect(parseEntryUrl("https://peakd.com/@alice/my-post")).toBeNull();
    expect(parseEntryUrl("https://notecency.com/@alice/my-post")).toBeNull();
    expect(parseEntryUrl("https://evil.com/@alice/my-post")).toBeNull();
  });

  it("rejects non-http(s) protocols", () => {
    expect(parseEntryUrl("ftp://ecency.com/@alice/my-post")).toBeNull();
    expect(parseEntryUrl("javascript:alert(1)//ecency.com/@a/b")).toBeNull();
  });

  it("returns null when there is no @author segment", () => {
    expect(parseEntryUrl("https://ecency.com/trending")).toBeNull();
    expect(parseEntryUrl("https://ecency.com/")).toBeNull();
  });

  it("returns null when the permlink is missing (profile root)", () => {
    expect(parseEntryUrl("https://ecency.com/@alice")).toBeNull();
  });

  it("returns null for malformed input", () => {
    expect(parseEntryUrl("not a url")).toBeNull();
    expect(parseEntryUrl("")).toBeNull();
  });
});
