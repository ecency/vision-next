import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { catchPostImage } from "@ecency/render-helper";
import { buildArticleJsonLd, buildProfileJsonLd } from "@/features/structured-data";
import { useEntryPollExtractor } from "@/features/polls/hooks/use-entry-poll-extractor";
import { useEntryLocation } from "@/utils/use-entry-location";
import { mockEntry, mockFullAccount } from "@/specs/test-utils";

vi.mock("@ecency/render-helper", async () => ({
  ...(await vi.importActual<typeof import("@ecency/render-helper")>("@ecency/render-helper")),
  catchPostImage: vi.fn()
}));

vi.mock("@/utils", async () => ({
  ...(await vi.importActual("@/utils")),
  random: vi.fn(),
  getAccessToken: vi.fn(() => "mock-token")
}));

// The entry route renders these during SSR with no Suspense boundary above the
// post body, so a throw here is a full-page 500 (see the route's page.tsx).
// json_metadata and posting_json_metadata are untrusted on-chain data.
describe("entry SSR path tolerates malformed metadata", () => {
  const url = "https://ecency.com/@alice/hello";

  it("buildArticleJsonLd falls back to the username when profile.name is not a string", () => {
    vi.mocked(catchPostImage).mockReturnValue("");
    const entry = mockEntry({ author: "alice", permlink: "hello", title: "Hello" });
    for (const name of [42, {}, ["x"], null]) {
      const account = mockFullAccount({ name: "alice", profile: { name } as any });
      const data = buildArticleJsonLd({ entry, account, url }) as any;
      expect(data.author.name).toBe("alice");
    }
  });

  it("buildArticleJsonLd ignores a non-string json_metadata.description", () => {
    vi.mocked(catchPostImage).mockReturnValue("");
    const entry = mockEntry({ body: "summary body", json_metadata: { description: { a: 1 } } as any });
    const data = buildArticleJsonLd({ entry, account: null, url }) as any;
    expect(typeof data.description).toBe("string");
    expect(data.description).not.toContain("object");
  });

  it("buildProfileJsonLd tolerates non-string profile fields", () => {
    const account = mockFullAccount({
      name: "alice",
      profile: { name: 7, about: ["x"], website: { url: "y" } } as any
    });
    const data = buildProfileJsonLd({ account, username: "alice" }) as any;
    expect(data.mainEntity.name).toBe("alice");
    expect(data.mainEntity.description).toBeUndefined();
    expect(data.mainEntity.sameAs).toBeUndefined();
  });

  it("buildArticleJsonLd survives a throwing image lookup", () => {
    vi.mocked(catchPostImage).mockImplementation(() => {
      throw new Error("hostile markdown");
    });
    const entry = mockEntry({ author: "alice", permlink: "hello", title: "Hello" });
    const data = buildArticleJsonLd({ entry, account: null, url }) as any;
    expect(data.image).toBeUndefined();
    expect(data.headline).toBe("Hello");
  });

  it("useEntryPollExtractor drops non-string question and choices", () => {
    const entry = mockEntry({
      json_metadata: {
        content_type: "poll",
        question: { nested: true },
        choices: ["a", { b: 1 }, null, "c"],
        end_time: 1
      } as any
    });
    const { result } = renderHook(() => useEntryPollExtractor(entry));
    expect(result.current?.title).toBe("");
    expect(result.current?.choices).toEqual(["a", "c"]);
  });

  it("useEntryLocation ignores a malformed metadata location", () => {
    const bad = [
      { coordinates: { lat: "1", lng: "2" }, address: "x" },
      { coordinates: { lat: 1, lng: 2 }, address: { street: "x" } },
      { address: "no coordinates" },
      "just a string"
    ];
    for (const location of bad) {
      const entry = mockEntry({ body: "plain body", json_metadata: { location } as any });
      const { result } = renderHook(() => useEntryLocation(entry));
      expect(result.current).toBeUndefined();
    }
  });

  it("useEntryLocation keeps a well-formed metadata location", () => {
    const location = { coordinates: { lat: 1.5, lng: 2.5 }, address: "Somewhere" };
    const entry = mockEntry({ json_metadata: { location } as any });
    const { result } = renderHook(() => useEntryLocation(entry));
    expect(result.current).toEqual(location);
  });
});
