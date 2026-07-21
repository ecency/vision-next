import React, { PropsWithChildren } from "react";
import { QueryClient, QueryClientProvider, queryOptions } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// The hook only touches these two SDK exports, so the module is re-mocked here
// (the global @ecency/sdk mock has no drafts query factory) with a queryFn the
// test controls.
const draftsQueryFn = vi.fn();

vi.mock("@ecency/sdk", () => ({
  getDraftsQueryOptions: (username?: string) =>
    queryOptions({
      queryKey: ["posts", "drafts", username],
      queryFn: () => draftsQueryFn()
    }),
  QueryKeys: {
    posts: {
      drafts: (username?: string) => ["posts", "drafts", username],
      draftsInfinite: (username?: string, limit?: number) => [
        "posts",
        "drafts-infinite",
        username,
        limit
      ]
    }
  }
}));

import { useApiDraftDetector } from "@/app/submit/_hooks/api-draft-detector";

const DRAFT = { _id: "draft-1", title: "t", body: "b", tags: "", meta: {} };

// renderHook swallows a render-time throw (result.current just stays undefined), so
// the hook renders under a boundary that records what it caught.
class ErrorBoundary extends React.Component<
  PropsWithChildren<{ onError: (e: Error) => void }>,
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    this.props.onError(error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function setup(draftId: string | undefined) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  const onDraftLoaded = vi.fn();
  const onInvalidDraft = vi.fn();
  const renderErrors: Error[] = [];
  const rendered = renderHook(() => useApiDraftDetector(draftId, onDraftLoaded, onInvalidDraft), {
    wrapper: ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary onError={(e) => renderErrors.push(e)}>{children}</ErrorBoundary>
      </QueryClientProvider>
    )
  });
  return { ...rendered, onDraftLoaded, onInvalidDraft, queryClient, renderErrors };
}

describe("useApiDraftDetector", () => {
  beforeEach(() => {
    draftsQueryFn.mockReset();
  });

  // Regression (Sentry ECENCY-NEXT-1FPT): `placeholderData: []` is only applied
  // while a query is pending, so a failed drafts request left `data` undefined and
  // `data.find(...)` threw a TypeError that took the whole submit page down.
  it("does not throw when the drafts request fails", async () => {
    draftsQueryFn.mockRejectedValue(new Error("Failed to fetch drafts: 502"));

    const { onDraftLoaded, onInvalidDraft, queryClient, renderErrors } = setup("draft-1");

    await waitFor(() =>
      expect(queryClient.getQueryState(["posts", "drafts", undefined])?.status).toBe("error")
    );

    expect(renderErrors).toEqual([]);
    expect(onDraftLoaded).not.toHaveBeenCalled();
    // A failed list is not evidence that the draft is gone, so the editor is left alone.
    expect(onInvalidDraft).not.toHaveBeenCalled();
  });

  it("loads the draft when the list resolves with it", async () => {
    draftsQueryFn.mockResolvedValue([DRAFT]);

    const { onDraftLoaded, onInvalidDraft } = setup("draft-1");

    await waitFor(() => expect(onDraftLoaded).toHaveBeenCalledTimes(1));
    expect(onDraftLoaded).toHaveBeenCalledWith(expect.objectContaining({ _id: "draft-1" }));
    expect(onInvalidDraft).not.toHaveBeenCalled();
  });

  it("reports an invalid draft only once the list has loaded without it", async () => {
    draftsQueryFn.mockResolvedValue([{ ...DRAFT, _id: "other-draft" }]);

    const { onDraftLoaded, onInvalidDraft } = setup("draft-1");

    await waitFor(() => expect(onInvalidDraft).toHaveBeenCalledTimes(1));
    expect(onDraftLoaded).not.toHaveBeenCalled();
  });
});
