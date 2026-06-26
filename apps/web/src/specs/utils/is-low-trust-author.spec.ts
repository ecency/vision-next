import { describe, it, expect } from "vitest";
import {
  hasExternalLink,
  isLowTrustSeoPost
} from "@/utils/is-low-trust-author";

describe("hasExternalLink", () => {
  it("detects a bare outbound URL", () => {
    expect(hasExternalLink("Visit https://nailsalon.example.com today")).toBe(true);
  });

  it("detects an outbound markdown link", () => {
    expect(hasExternalLink("[my site](https://imghelpinghands.example/page)")).toBe(true);
  });

  it("ignores Hive/Ecency internal links", () => {
    expect(hasExternalLink("see [post](https://ecency.com/@a/b) and https://peakd.com/@a/b")).toBe(
      false
    );
  });

  it("ignores newer Hive frontend links (snapie.io, hivesuite.app)", () => {
    expect(hasExternalLink("read https://snapie.io/@a/b and https://hivesuite.app/hive/@a/b")).toBe(
      false
    );
  });

  it("ignores embedded images (extension and image hosts)", () => {
    expect(hasExternalLink("![pic](https://images.ecency.com/abc.jpg)")).toBe(false);
    expect(hasExternalLink("![pic](https://i.imgur.com/abc.png)")).toBe(false);
    expect(hasExternalLink("![pic](https://other.example/photo.webp)")).toBe(false);
  });

  it("returns false for empty / missing body", () => {
    expect(hasExternalLink("")).toBe(false);
    expect(hasExternalLink(undefined)).toBe(false);
    expect(hasExternalLink("plain text, no links")).toBe(false);
  });

  it("strips trailing prose punctuation (no false positive on internal link + comma)", () => {
    expect(hasExternalLink("see https://ecency.com, and enjoy")).toBe(false);
  });

  it("still detects an outbound link followed by punctuation", () => {
    expect(hasExternalLink("visit https://shop.example.")).toBe(true);
  });

  it("detects protocol-relative outbound links", () => {
    expect(hasExternalLink("[promo](//shop.example/page)")).toBe(true);
  });

  it("ignores protocol-relative internal links", () => {
    expect(hasExternalLink("see //peakd.com/@a/b")).toBe(false);
  });

  it("ignores stray // tokens without a domain", () => {
    expect(hasExternalLink("a // b and 10//5")).toBe(false);
  });
});

describe("isLowTrustSeoPost", () => {
  it("flags a low-reputation author with an outbound link", () => {
    expect(isLowTrustSeoPost({ author_reputation: 20, body: "promo https://shop.example" })).toBe(
      true
    );
  });

  it("does not flag a high-reputation author with an outbound link", () => {
    expect(isLowTrustSeoPost({ author_reputation: 65, body: "promo https://shop.example" })).toBe(
      false
    );
  });

  it("does not flag a low-reputation author without an outbound link", () => {
    expect(
      isLowTrustSeoPost({ author_reputation: 20, body: "hello [post](https://ecency.com/@a/b)" })
    ).toBe(false);
  });

  it("treats brand-new accounts (raw reputation 0 -> 25) as low trust", () => {
    expect(isLowTrustSeoPost({ author_reputation: 0, body: "https://shop.example" })).toBe(true);
  });
});
