import React, { PropsWithChildren } from "react";
import { QueryClient, QueryClientProvider, queryOptions } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// The hook only touches these two SDK exports, so the module is re-mocked here
// (the global @ecency/sdk mock has no drafts query factory) with a queryFn the
// test controls.
const draftsQueryFn = vi.fn();
// The real factory disables the query without a username and an access token; flip this
// to reproduce a signed-out / token-less editor.
const draftsQueryState = { enabled: true };

vi.mock("@ecency/sdk", () => ({
  getDraftsQueryOptions: (username?: string) =>
    queryOptions({
      queryKey: ["posts", "drafts", username],
      queryFn: () => draftsQueryFn(),
      enabled: draftsQueryState.enabled
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
    draftsQueryState.enabled = true;
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

  // A user with no drafts opening a stale draft URL still has to reach the no-draft
  // state: a successful empty list proves the draft is absent just as a populated one does.
  it("reports an invalid draft when the list loads empty", async () => {
    draftsQueryFn.mockResolvedValue([]);

    const { onDraftLoaded, onInvalidDraft } = setup("draft-1");

    await waitFor(() => expect(onInvalidDraft).toHaveBeenCalledTimes(1));
    expect(onDraftLoaded).not.toHaveBeenCalled();
  });

  // A disabled query keeps `placeholderData: []` and query-core reports that placeholder
  // as status "success" with `isPlaceholderData: true`, so "success and idle" alone would
  // read a signed-out editor as a loaded, empty drafts list and throw the draft away.
  it("does not report an invalid draft while the query is disabled", async () => {
    draftsQueryState.enabled = false;

    const { onDraftLoaded, onInvalidDraft, queryClient } = setup("draft-1");

    await waitFor(() =>
      expect(queryClient.getQueryState(["posts", "drafts", undefined])?.fetchStatus).toBe("idle")
    );
    expect(draftsQueryFn).not.toHaveBeenCalled();
    expect(onInvalidDraft).not.toHaveBeenCalled();
    expect(onDraftLoaded).not.toHaveBeenCalled();
  });

  it("does not report an invalid draft when no draft is being edited", async () => {
    draftsQueryFn.mockResolvedValue([]);

    const { onInvalidDraft, queryClient } = setup(undefined);

    await waitFor(() =>
      expect(queryClient.getQueryState(["posts", "drafts", undefined])?.status).toBe("success")
    );
    expect(onInvalidDraft).not.toHaveBeenCalled();
  });
});
