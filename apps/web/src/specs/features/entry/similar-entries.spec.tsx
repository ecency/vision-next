import { vi, describe, it, expect, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { renderWithQueryClient, mockEntry } from "@/specs/test-utils";
import { useQuery } from "@tanstack/react-query";

// Replaces the dead, co-located index.spec.tsx (jest API + pre-App-Router
// props + outside src/specs/ so Vitest never collected it). Locks the
// >= SIMILAR_ENTRIES_MIN_RENDER render gate (was the all-or-nothing `!== 3`).

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual<any>("@tanstack/react-query");
  return { ...actual, useQuery: vi.fn() };
});

vi.mock("@ecency/sdk", async () => {
  const actual = await vi.importActual<any>("@ecency/sdk");
  return {
    ...actual,
    getSimilarEntriesQueryOptions: vi.fn(() => ({
      queryKey: ["search", "similar-entries"],
      queryFn: vi.fn(),
    })),
  };
});

// Stub the card so the gate test doesn't pull EntryLink / framer-motion /
// next-image into the render.
vi.mock(
  "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/similar-entries/similar-entry-item",
  () => ({
    SimilarEntryItem: ({ entry }: { entry: { permlink: string } }) => (
      <div data-testid="similar-item">{entry.permlink}</div>
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
  });

  it("renders with 2 results", () => {
    setData([item("p1"), item("p2")]);
    renderWithQueryClient(<SimilarEntries entry={entry} />);
    expect(screen.getByText(HEADER)).toBeInTheDocument();
    expect(screen.getAllByTestId("similar-item")).toHaveLength(2);
  });

  it("renders with 3 results", () => {
    setData([item("p1"), item("p2"), item("p3")]);
    renderWithQueryClient(<SimilarEntries entry={entry} />);
    expect(screen.getAllByTestId("similar-item")).toHaveLength(3);
  });

  it("hides the strip when data is undefined / non-array", () => {
    setData(undefined);
    renderWithQueryClient(<SimilarEntries entry={entry} />);
    expect(screen.queryByText(HEADER)).toBeNull();
  });
});
