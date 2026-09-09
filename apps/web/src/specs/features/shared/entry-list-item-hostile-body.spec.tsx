import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { catchPostImage } from "@ecency/render-helper";

// Deliberately NO mock for @ecency/render-helper: this spec exists to prove the
// call sites survive the REAL extractor throwing. The app resolves the package
// through its committed dist, which is only rebuilt on a release, so the
// package fix in this change does not reach production until then — these
// guards are what stands in the meantime, and mocking the package away would
// test nothing.
vi.mock("@/core/global-store", () => ({
  useGlobalStore: (selector: any) => selector({ listStyle: "row" })
}));
vi.mock("@/features/shared", () => ({
  EntryLink: ({ children, className }: any) => <div className={className}>{children}</div>
}));
vi.mock("next/image", () => ({
  default: ({ src, alt }: any) => <img src={src} alt={alt ?? ""} />
}));
vi.mock("@/core/sentry/lazy-sentry", () => ({
  sentry: { captureException: vi.fn() }
}));

import { sentry } from "@/core/sentry/lazy-sentry";
import { EntryListItemThumbnail } from "@/features/shared/entry-list-item/entry-list-item-thumbnail";
import { EntryListThumbPreload } from "@/features/shared/entry-list-item/entry-list-thumb-preload";
import { catchPostImageSafely } from "@/core/entries/catch-post-image-safely";

const NO_IMG = "/assets/noimage.png";

// One line any account can broadcast. `sanitizeHtml` decoded numeric character
// references with a bare String.fromCodePoint, so extracting a thumbnail from
// this body raises `RangeError: Invalid code point 1114112` from inside
// catchPostImage. The malformed closing tag is load-bearing on the decimal
// form: `<div ...>x</div>` is protected by the entity-placeholder step in
// markdown-to-html and does NOT throw.
const HOSTILE_BODY = `<div title="&#x110000;">boom</div>`;
const HOSTILE_BODY_MALFORMED = `<div title="&#1114112;">boom</span>`;

// catchPostImage memoises per author/permlink/last_update/size/format, so a
// reused permlink would serve a cached answer and hide the throw.
let n = 0;
const hostileEntry = (body = HOSTILE_BODY): any => ({
  author: "crafted",
  permlink: `hostile-${++n}`,
  last_update: "2026-09-09T00:00:00",
  parent_permlink: "",
  title: "Hostile",
  body,
  json_metadata: {}
});

const mainImg = (c: HTMLElement) => c.querySelector("img");

describe("feed thumbnail with a body that breaks the image extractor", () => {
  beforeEach(() => {
    vi.mocked(sentry.captureException).mockClear();
  });

  it.each([
    ["hex", HOSTILE_BODY],
    ["malformed decimal", HOSTILE_BODY_MALFORMED]
  ])("the real extractor really does throw on the %s body", (_label, body) => {
    expect(() => catchPostImage(hostileEntry(body), 600, 500, "match")).toThrow(RangeError);
  });

  it.each([
    ["hex", HOSTILE_BODY],
    ["malformed decimal", HOSTILE_BODY_MALFORMED]
  ])("renders the card with the placeholder instead of crashing (%s)", (_label, body) => {
    const entry = hostileEntry(body);
    const { container } = render(
      <EntryListItemThumbnail entry={entry} entryProp={entry} isCrossPost={false} noImage={NO_IMG} />
    );
    const img = mainImg(container)!;
    expect(img).toBeTruthy();
    expect(img.getAttribute("src")).toBe(NO_IMG);
    expect(img.getAttribute("srcset")).toBeNull();
    // The LQIP layer is driven by a second catchPostImage call; it must be gone
    // rather than pointing at a half-built URL.
    expect(container.querySelector('img[aria-hidden="true"]')).toBeNull();
  });

  it("emits no preload link for a card whose thumbnail cannot be extracted", () => {
    const entry = hostileEntry();
    expect(() => render(<EntryListThumbPreload entries={[entry]} />)).not.toThrow();
    expect(
      document.head.querySelector(`link[rel="preload"][href*="${entry.permlink}"]`)
    ).toBeNull();
  });

  it("still preloads a healthy card that follows a broken one", () => {
    const healthy = {
      ...hostileEntry(),
      body: "",
      json_metadata: { image: ["https://images.ecency.com/DQmHealthy/pic.png"] }
    };
    render(<EntryListThumbPreload entries={[hostileEntry(), healthy]} />);
    expect(
      document.head.querySelector('link[rel="preload"][as="image"][imagesrcset]')
    ).toBeTruthy();
  });

  it("reports one broken post once, however many calls and renders it takes", () => {
    const entry = hostileEntry();
    // The thumbnail alone calls the extractor twice (full size + LQIP).
    const first = render(
      <EntryListItemThumbnail entry={entry} entryProp={entry} isCrossPost={false} noImage={NO_IMG} />
    );
    expect(sentry.captureException).toHaveBeenCalledTimes(1);
    expect(sentry.captureException).toHaveBeenCalledWith(
      expect.any(RangeError),
      expect.objectContaining({ extra: expect.objectContaining({ where: "catchPostImage" }) })
    );

    first.rerender(
      <EntryListItemThumbnail entry={entry} entryProp={entry} isCrossPost={false} noImage={NO_IMG} />
    );
    render(<EntryListThumbPreload entries={[entry]} />);
    render(
      <EntryListItemThumbnail entry={entry} entryProp={entry} isCrossPost={false} noImage={NO_IMG} />
    );
    expect(sentry.captureException).toHaveBeenCalledTimes(1);

    // A different broken post is still worth an event of its own.
    render(<EntryListThumbPreload entries={[hostileEntry()]} />);
    expect(sentry.captureException).toHaveBeenCalledTimes(2);
  });

  it("guards the raw-string call shape the search row uses", () => {
    expect(() => catchPostImage(HOSTILE_BODY, 600, 500)).toThrow(RangeError);
    expect(catchPostImageSafely(HOSTILE_BODY, 600, 500)).toBeNull();
    expect(catchPostImageSafely(HOSTILE_BODY_MALFORMED, 600, 500)).toBeNull();
    // Both string bodies are distinct, so one event each - and repeating one
    // adds nothing.
    expect(sentry.captureException).toHaveBeenCalledTimes(2);
    expect(catchPostImageSafely(HOSTILE_BODY, 600, 500)).toBeNull();
    expect(sentry.captureException).toHaveBeenCalledTimes(2);
  });
});
