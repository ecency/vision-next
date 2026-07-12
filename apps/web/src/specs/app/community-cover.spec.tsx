import React from "react";
import { render, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, expect, it, vi } from "vitest";

// The community cover is the LCP element on community pages. It must render as a
// real, eager, high-priority <img> — the deterministic markup emitted into the
// SSR HTML that the preload scanner can discover — NOT as a CSS background-image
// (which the browser finds late and paints seconds after load). These tests
// guard against a regression back to a background-image.

const store = vi.hoisted(() => ({
  users: [] as { username: string }[],
  theme: "day" as "day" | "night",
  imageProxy: "https://i.ecency.com"
}));
vi.mock("@/core/global-store", () => ({
  useGlobalStore: (selector: any) => selector(store)
}));
vi.mock("@tanstack/react-query", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-query")>()),
  useQuery: () => ({ data: undefined })
}));
vi.mock("@/utils", async () => ({
  ...(await vi.importActual("@/utils")),
  random: vi.fn(),
  getAccessToken: vi.fn(() => "mock-token")
}));
// Stub the heavy children so the test isolates the cover markup.
vi.mock("@/app/communities/_components", () => ({
  SubscriptionBtn: () => <button>subscribe</button>
}));
vi.mock(
  "@/app/(dynamicPages)/community/[community]/_components/community-cover-edit-image",
  () => ({ CommunityCoverEditImage: () => null })
);

import { CommunityCover } from "@/app/(dynamicPages)/community/[community]/_components/community-cover";

const community: any = {
  name: "hive-125125",
  title: "Community",
  subscribers: 10,
  sum_pending: 5,
  num_authors: 3,
  lang: "en"
};
const account: any = { name: "hive-125125" };

const coverImg = (c: HTMLElement) =>
  Array.from(c.querySelectorAll("img")).find((i) =>
    i.getAttribute("src")?.includes("/u/hive-125125/cover")
  );

describe("CommunityCover — SSR-discoverable LCP cover image", () => {
  it("renders the cover as an eager, high-priority <img> (not a CSS background)", () => {
    const { container } = render(<CommunityCover community={community} account={account} />);

    const img = coverImg(container);
    expect(img).toBeTruthy();
    expect(img!.getAttribute("src")).toBe("https://i.ecency.com/u/hive-125125/cover");
    expect(img!.getAttribute("fetchpriority")).toBe("high");
    expect(img!.getAttribute("loading")).toBe("eager");
    expect(img!.getAttribute("decoding")).toBe("async");

    // Regression guard: no element paints the cover via a CSS background-image.
    const bgWithCover = Array.from(container.querySelectorAll<HTMLElement>("[style]")).some((el) =>
      (el.getAttribute("style") ?? "").includes("/u/hive-125125/cover")
    );
    expect(bgWithCover).toBe(false);
  });

  it("falls back to the themed asset when the cover image fails to load", () => {
    const { container } = render(<CommunityCover community={community} account={account} />);

    const img = coverImg(container);
    expect(img).toBeTruthy();
    fireEvent.error(img!);

    const anyImg = container.querySelector("img");
    expect(anyImg!.getAttribute("src")).toBe("/assets/cover-fallback-day.png");
  });
});
