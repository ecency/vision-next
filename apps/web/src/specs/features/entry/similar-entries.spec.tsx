import { vi, describe, it, expect, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { renderWithQueryClient, mockEntry } from "@/specs/test-utils";
import { useQuery } from "@tanstack/react-query";

// Replaces the dead, co-located index.spec.tsx (jest API + pre-App-Router
// props + outside src/specs/ so Vitest never collected it). Focused unit:
// the >= SIMILAR_ENTRIES_MIN_RENDER render gate (was the all-or-nothing
// `!== 3`). Assertions are on user-visible output (header + permlink text).

vi.mock("@tanstack/react-query", async () => {
  const actual =
    await vi.importActual<typeof import("@tanstack/react-query")>(
      "@tanstack/react-query"
    );
  return { ...actual, useQuery: vi.fn() };
});

vi.mock("@ecency/sdk", async () => {
  const actual = await vi.importActual<typeof import("@ecency/sdk")>("@ecency/sdk");
  return {
    ...actual,
    getSimilarEntriesQueryOptions: vi.fn(() => ({
      queryKey: ["search", "similar-entries"],
      queryFn: vi.fn(),
    })),
  };
});

// The card is stubbed deliberately: this is a render-GATE unit test, so the
// child's own rendering (CSS entrance / next-image / EntryLink routing) is
// out of scope and covered elsewhere. The stub emits the permlink as plain
// text so assertions stay on user-visible output, not test-ids.
vi.mock(
  "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/similar-entries/similar-entry-item",
  () => ({
    SimilarEntryItem: ({ entry }: { entry: { permlink: string } }) => (
      <div>{entry.permlink}</div>
    ),
  })
);

import { SimilarEntries } from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/similar-entries";

const HEADER = "similar-entries.title"; // i18next is mocked to return the key
const item = (permlink: string) => ({
  id: 0,
  author: "a",
  permlink,
  title: "t",
  created_at: "",
  img_url: "",
  tags: [],
});

describe("SimilarEntries render gate (>= SIMILAR_ENTRIES_MIN_RENDER, =2)", () => {
  const entry = mockEntry({ author: "bob", permlink: "post" });

  beforeEach(() => vi.clearAllMocks());

  const setData = (data: unknown) =>
    vi.mocked(useQuery).mockReturnValue({ data } as ReturnType<typeof useQuery>);

  it("hides the strip with 0 results", () => {
    setData([]);
    renderWithQueryClient(<SimilarEntries entry={entry} />);
    expect(screen.queryByText(HEADER)).toBeNull();
  });

  it("hides the strip with 1 result (below the min of 2)", () => {
    setData([item("p1")]);
    renderWithQueryClient(<SimilarEntries entry={entry} />);
    expect(screen.queryByText(HEADER)).toBeNull();
    expect(screen.queryByText("p1")).toBeNull();
  });

  it("renders with 2 results", () => {
    setData([item("p1"), item("p2")]);
    renderWithQueryClient(<SimilarEntries entry={entry} />);
    expect(screen.getByText(HEADER)).toBeInTheDocument();
    expect(screen.getByText("p1")).toBeInTheDocument();
    expect(screen.getByText("p2")).toBeInTheDocument();
  });

  it("renders with 3 results", () => {
    setData([item("p1"), item("p2"), item("p3")]);
    renderWithQueryClient(<SimilarEntries entry={entry} />);
    expect(screen.getByText(HEADER)).toBeInTheDocument();
    expect(screen.getByText("p1")).toBeInTheDocument();
    expect(screen.getByText("p2")).toBeInTheDocument();
    expect(screen.getByText("p3")).toBeInTheDocument();
  });

  it("hides the strip when data is undefined / non-array", () => {
    setData(undefined);
    renderWithQueryClient(<SimilarEntries entry={entry} />);
    expect(screen.queryByText(HEADER)).toBeNull();
  });
});
