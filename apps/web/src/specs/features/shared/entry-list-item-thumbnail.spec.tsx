import React from "react";
import { render, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Render the cover thumbnail as an SSR-discoverable proxied <img> (no client
// blob→base64). Stub the render-helper proxy fns + a configurable list store.
const store = vi.hoisted(() => ({ listStyle: "row" as "row" | "grid" }));
vi.mock("@/core/global-store", () => ({
  useGlobalStore: (selector: any) => selector({ listStyle: store.listStyle })
}));
vi.mock("@/features/shared", () => ({
  EntryLink: ({ children, className }: any) => <div className={className}>{children}</div>
}));
// next/image stub that surfaces `priority` so the grid branch can be asserted.
vi.mock("next/image", () => ({
  default: ({ src, alt, priority, onError }: any) => (
    <img src={src} alt={alt ?? ""} data-priority={priority ? "true" : "false"} onError={onError} />
  )
}));
vi.mock("@ecency/render-helper", () => ({
  catchPostImage: vi.fn((entry: any, w?: number) =>
    entry?.__noimg
      ? null
      : (w ?? 0) > 0
        ? "https://i.ecency.com/p/HASH?format=match&mode=fit&width=600&height=500"
        : "https://i.ecency.com/p/HASH?format=match&mode=fit"
  ),
  buildSrcSet: vi.fn(
    () => "https://i.ecency.com/p/HASH?width=320 320w, https://i.ecency.com/p/HASH?width=600 600w"
  ),
  proxifyImageSrc: vi.fn(() => "https://i.ecency.com/p/HASH?blur=1"),
  IMAGE_SIZES: "(max-width: 768px) 100vw, 700px"
}));

import { EntryListItemThumbnail } from "@/features/shared/entry-list-item/entry-list-item-thumbnail";

const NO_IMG = "/assets/noimage.png";
const entry: any = {
  author: "alice",
  permlink: "post-1",
  parent_permlink: "",
  title: "Hello",
  json_metadata: { image: ["x"] }
};

const mainImg = (c: HTMLElement) =>
  Array.from(c.querySelectorAll("img")).find((i) => i.getAttribute("src")?.includes("width=600"));

describe("EntryListItemThumbnail — SSR-discoverable LCP image", () => {
  beforeEach(() => {
    store.listStyle = "row";
  });

  it("renders a proxied <img src>+srcset in markup (not a base64 data URL)", () => {
    const { container } = render(
      <EntryListItemThumbnail entry={entry} entryProp={entry} isCrossPost={false} noImage={NO_IMG} />
    );
    const img = mainImg(container)!;
    expect(img).toBeTruthy();
    expect(img.getAttribute("src")!.startsWith("data:")).toBe(false);
    expect(img.getAttribute("src")).toContain("i.ecency.com/p/");
    expect(img.getAttribute("srcset")).toContain("600w");
    // Thumbnail-sized (150px desktop), not the post-body 700px — avoids
    // over-fetching a large candidate for the small row thumbnail.
    expect(img.getAttribute("sizes")).toContain("150px");
    expect(img.getAttribute("sizes")).not.toContain("700px");
  });

  it("renders the grid (next/image) variant with proxied src + priority for the LCP item", () => {
    store.listStyle = "grid";
    const { container } = render(
      <EntryListItemThumbnail
        entry={entry}
        entryProp={entry}
        isCrossPost={false}
        noImage={NO_IMG}
        isThumbLcp
      />
    );
    const img = container.querySelector("img[data-priority]")!;
    expect(img).toBeTruthy();
    expect(img.getAttribute("src")!.startsWith("data:")).toBe(false);
    expect(img.getAttribute("src")).toContain("i.ecency.com/p/");
    expect(img.getAttribute("data-priority")).toBe("true");
  });

  it("marks the above-fold item eager+high priority, others lazy", () => {
    const lcp = mainImg(
      render(
        <EntryListItemThumbnail
          entry={entry}
          entryProp={entry}
          isCrossPost={false}
          noImage={NO_IMG}
          isThumbLcp
        />
      ).container
    )!;
    expect(lcp.getAttribute("loading")).toBe("eager");
    expect(lcp.getAttribute("fetchpriority")).toBe("high");

    const lazy = mainImg(
      render(
        <EntryListItemThumbnail entry={entry} entryProp={entry} isCrossPost={false} noImage={NO_IMG} />
      ).container
    )!;
    expect(lazy.getAttribute("loading")).toBe("lazy");
    expect(lazy.getAttribute("fetchpriority")).toBeNull();
  });

  it("falls back to noImage when the post has no extractable image", () => {
    const { container } = render(
      <EntryListItemThumbnail
        entry={{ ...entry, __noimg: true }}
        entryProp={entry}
        isCrossPost={false}
        noImage={NO_IMG}
      />
    );
    const img = container.querySelector("img")!;
    expect(img.getAttribute("src")).toBe(NO_IMG);
    expect(img.getAttribute("srcset")).toBeNull();
  });

  it("swaps to noImage exactly once on error (loop-safe fallback)", () => {
    const { container } = render(
      <EntryListItemThumbnail
        entry={entry}
        entryProp={entry}
        isCrossPost={false}
        noImage={NO_IMG}
        isThumbLcp
      />
    );
    fireEvent.error(mainImg(container)!);
    const img = container.querySelector("img")!;
    expect(img.getAttribute("src")).toBe(NO_IMG);
    expect(img.getAttribute("srcset")).toBeNull();
  });

  it("hides the thumbnail for an image-less comment", () => {
    const { container } = render(
      <EntryListItemThumbnail
        entry={{ ...entry, __noimg: true, parent_permlink: "root-post" }}
        entryProp={entry}
        isCrossPost={false}
        noImage={NO_IMG}
      />
    );
    expect(container.querySelector("img")).toBeNull();
  });
});
