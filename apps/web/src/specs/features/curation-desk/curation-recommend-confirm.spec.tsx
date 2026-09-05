import React from "react";
import "@testing-library/jest-dom";
import { act, fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryKeys, type CurationPost } from "@ecency/sdk";
import { renderWithQueryClient } from "@/specs/test-utils";
import { installFetchRouter, jsonResponse, makePost, makeRoster, makeRow } from "./curation-test-utils";

const state = vi.hoisted(() => ({
  username: "member1" as string | undefined,
  result: (() => Promise.resolve<unknown>({ tx_id: "e".repeat(40) })) as () => Promise<unknown>,
  broadcasts: [] as boolean[],
  /** Broadcasts whose promise has not settled: what a real useMutation reports as isPending. */
  inFlight: 0,
}));

vi.mock("@ecency/sdk", async () => ({ ...(await vi.importActual<Record<string, unknown>>("@ecency/sdk")) }));
vi.mock("@/utils", async () => ({
  ...(await vi.importActual<Record<string, unknown>>("@/utils")),
  ensureValidToken: vi.fn(async () => "code-1"),
}));
vi.mock("@/core/hooks/use-active-username", () => ({ useActiveUsername: () => state.username }));
vi.mock("@/core/hooks/use-active-account", () => ({
  useActiveAccount: () => ({ activeUser: { username: state.username }, account: null, isLoading: false }),
}));
vi.mock("@/core/global-store", () => ({
  useGlobalStore: (selector: (s: unknown) => unknown) =>
    selector({ toggleUiProp: vi.fn(), activeUser: { username: state.username } }),
}));
vi.mock("@/features/shared/feedback", () => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("@/api/format-error", () => ({ formatError: (e: unknown) => [String(e), "common"] }));
vi.mock("@ui/modal", () => ({
  Modal: ({ show, children }: { show: boolean; children: React.ReactNode }) => (show ? <div role="dialog">{children}</div> : null),
  ModalHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ModalBody: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ModalFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ModalTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/api/sdk-mutations/use-curation-recommend-mutation", () => ({
  useCurationRecommendMutation: () => ({
    // Per observer, like the real hook: one held promise keeps it true for
    // whatever post the same button instance shows next.
    isPending: state.inFlight > 0,
    mutateAsync: async (input: { withdraw?: boolean }) => {
      state.broadcasts.push(!!input.withdraw);
      state.inFlight += 1;
      try {
        return await state.result();
      } finally {
        state.inFlight -= 1;
      }
    },
  }),
}));

import { CurationRecommendBtn, type CurationRecommendHandle } from "@/features/curation-desk/curation-recommend-btn";
import { error as errorToast, success } from "@/features/shared/feedback";
import { resetRecommendFlowForTests } from "@/features/curation-desk/curation-recommend-flow";
import {
  getRecommendState,
  resetRecommendStoreForTests,
  setRecommendState,
} from "@/features/curation-desk/curation-recommend-store";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/**
 * What the confirming poll may treat as proof. Route 5 is memoized at the
 * gateway, so an answer can be older than the broadcast that asked about it.
 */
describe("recommend confirmation", () => {
  let router: ReturnType<typeof installFetchRouter>;
  const row = makeRow({ post_id: 1, author: "alice", permlink: "morning-light", recommend_count: 4, unique_recommenders: 3 });
  const mine = { username: "member1", rep: 55, reason: "quality" as const, at: "2026-09-05T12:00:03Z", has_meta: true };

  beforeEach(() => {
    vi.useFakeTimers();
    state.username = "member1";
    state.result = () => Promise.resolve({ tx_id: "e".repeat(40) });
    state.broadcasts.length = 0;
    state.inFlight = 0;
    resetRecommendFlowForTests();
    resetRecommendStoreForTests();
    vi.mocked(errorToast).mockClear();
    vi.mocked(success).mockClear();
    router = installFetchRouter()
      .on(/curation-desk\/roster$/, () => makeRoster())
      .on(/curation-desk\/recommend-meta$/, () => jsonResponse({ ok: true }, 202));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  async function clickWithdraw() {
    await act(async () => {
      fireEvent.click(screen.getByLabelText("curation-desk.recommend.withdraw-aria"));
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10);
    });
  }

  it("never reads a body that has not listed the viewer as a withdrawal", async () => {
    // Every answer predates the recommendation, so the missing name says
    // nothing about the withdrawal.
    router.on(/curation-desk\/post\//, () => makePost(row, { recommend_count: 4, recommenders: [] }));
    renderWithQueryClient(<CurationRecommendBtn author="alice" permlink="morning-light" alreadyRecommended />);
    await clickWithdraw();
    expect(state.broadcasts).toEqual([true]);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000);
    });
    expect(getRecommendState("member1", "alice", "morning-light").phase).toBe("pending");

    // The backoff ceiling still ends in the neutral state, never in "withdrawn".
    await act(async () => {
      await vi.advanceTimersByTimeAsync(56_000);
    });
    expect(router.callsTo(/curation-desk\/post\//)).toHaveLength(4);
    expect(getRecommendState("member1", "alice", "morning-light")).toEqual({ phase: "confirming", withdraw: true });
  });

  it("confirms the withdrawal once an answer that listed the viewer stops listing them", async () => {
    let listsViewer = true;
    router.on(/curation-desk\/post\//, () =>
      listsViewer
        ? makePost(row, { recommend_count: 4, recommenders: [mine] })
        : makePost(row, { recommend_count: 3, recommenders: [] })
    );
    renderWithQueryClient(<CurationRecommendBtn author="alice" permlink="morning-light" alreadyRecommended />);
    await clickWithdraw();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000);
    });
    expect(getRecommendState("member1", "alice", "morning-light").phase).toBe("pending");

    listsViewer = false;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000);
    });
    expect(getRecommendState("member1", "alice", "morning-light")).toEqual({ phase: "withdrawn" });
  });

  it("never reads another recommender's withdrawal as this viewer's", async () => {
    // Someone else withdraws between two polls: recommend_count falls while
    // this viewer's own recommendation is still on chain. Reading that as
    // proof would send the next Recommend to broadcast a duplicate.
    let count = 4;
    router.on(/curation-desk\/post\//, () =>
      makePost(row, {
        recommend_count: count,
        recommenders: [{ username: "bob", rep: 51, reason: "quality" as const, at: "2026-09-05T11:00:00Z", has_meta: true }]
      })
    );
    renderWithQueryClient(<CurationRecommendBtn author="alice" permlink="morning-light" alreadyRecommended />);
    await clickWithdraw();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000);
    });
    expect(getRecommendState("member1", "alice", "morning-light").phase).toBe("pending");

    count = 3;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(56_000);
    });
    // No answer ever listed this viewer, so the flow stays where it can be
    // asked again instead of claiming the recommendation is gone.
    expect(getRecommendState("member1", "alice", "morning-light")).toEqual({ phase: "confirming", withdraw: true });
  });

  it("sends one withdrawal only while the first is in flight, and says nothing about the second", async () => {
    router.on(/curation-desk\/post\//, () => makePost(row, { recommend_count: 4, recommenders: [] }));
    const ref = React.createRef<CurationRecommendHandle>();
    renderWithQueryClient(
      <CurationRecommendBtn ref={ref} author="alice" permlink="morning-light" alreadyRecommended />
    );
    await clickWithdraw();
    expect(state.broadcasts).toEqual([true]);
    expect(success).toHaveBeenCalledTimes(1);

    // The keyboard binding reaches the flow without asking the button, which
    // is disabled while the broadcast is in flight.
    expect(screen.getByLabelText("curation-desk.recommend.aria")).toBeDisabled();
    await act(async () => {
      ref.current?.trigger();
      await vi.advanceTimersByTimeAsync(10);
    });
    expect(state.broadcasts).toEqual([true]);
    // Nothing went out, so no "withdrawn" toast either.
    expect(success).toHaveBeenCalledTimes(1);
  });

  it("a withdrawal the signer is still holding does not block another post's withdrawal", async () => {
    // The quick view keeps one button mounted across rows: the same instance
    // shows another post while the first signer promise is still open.
    router.on(/curation-desk\/post\//, () => makePost(row, { recommend_count: 4, recommenders: [] }));
    state.result = () => new Promise(() => undefined);
    const { rerender } = renderWithQueryClient(
      <CurationRecommendBtn author="alice" permlink="morning-light" alreadyRecommended />
    );
    await clickWithdraw();
    expect(state.broadcasts).toEqual([true]);

    // The observer's isPending is still true for the held promise; the second
    // post is not busy, so its button is live and its withdrawal goes out.
    const ref = React.createRef<CurationRecommendHandle>();
    rerender(<CurationRecommendBtn ref={ref} author="alice" permlink="second-light" alreadyRecommended />);
    expect(screen.getByLabelText("curation-desk.recommend.withdraw-aria")).toBeEnabled();
    await clickWithdraw();
    expect(state.broadcasts).toEqual([true, true]);

    // The first post's own guard still holds while its broadcast is open, for
    // the button and for the keyboard binding alike: a pending withdrawal
    // must not open the reason picker either.
    rerender(<CurationRecommendBtn ref={ref} author="alice" permlink="morning-light" alreadyRecommended />);
    expect(screen.getByLabelText("curation-desk.recommend.aria")).toBeDisabled();
    await act(async () => {
      ref.current?.trigger();
      await vi.advanceTimersByTimeAsync(10);
    });
    expect(state.broadcasts).toEqual([true, true]);
    expect(screen.queryByText("curation-desk.recommend.title")).toBeNull();
  });

  it("confirms a withdrawal indexed before the first poll from this session's earlier confirmation", async () => {
    // The chain was quick: by the first poll every answer is already missing
    // the name. The earlier confirmation is the body that once carried it.
    router.on(/curation-desk\/post\//, () => makePost(row, { recommend_count: 3, recommenders: [] }));
    setRecommendState("member1", "alice", "morning-light", { phase: "recommended", confirmed: true });
    renderWithQueryClient(<CurationRecommendBtn author="alice" permlink="morning-light" />);
    await clickWithdraw();
    expect(state.broadcasts).toEqual([true]);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000);
    });
    expect(getRecommendState("member1", "alice", "morning-light")).toEqual({ phase: "withdrawn" });
    expect(screen.getByLabelText("curation-desk.recommend.aria")).toBeInTheDocument();
  });

  it("takes a cached route 5 body that lists the viewer as the proof a withdrawal needs", async () => {
    router.on(/curation-desk\/post\//, () => makePost(row, { recommend_count: 3, recommenders: [] }));
    const { queryClient } = renderWithQueryClient(
      <CurationRecommendBtn author="alice" permlink="morning-light" alreadyRecommended />
    );
    // What the quick view fetched a moment ago, with the name on it.
    queryClient.setQueryData(QueryKeys.curation.post("alice", "morning-light"), makePost(row, { recommenders: [mine] }));
    await clickWithdraw();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000);
    });
    expect(getRecommendState("member1", "alice", "morning-light")).toEqual({ phase: "withdrawn" });
  });

  it("a Withdraw from the parked state asks route 5 first and settles without a second broadcast", async () => {
    router.on(/curation-desk\/post\//, () => makePost(row, { recommend_count: 4, recommenders: [] }));
    const ref = React.createRef<CurationRecommendHandle>();
    renderWithQueryClient(
      <CurationRecommendBtn ref={ref} author="alice" permlink="morning-light" alreadyRecommended />
    );
    await clickWithdraw();

    // No answer ever carried the name: the poll parks the row in "confirming".
    await act(async () => {
      await vi.advanceTimersByTimeAsync(61_000);
    });
    expect(getRecommendState("member1", "alice", "morning-light")).toEqual({ phase: "confirming", withdraw: true });
    // Parked is not busy: the viewer can still act on the row.
    expect(screen.getByLabelText("curation-desk.recommend.withdraw-aria")).toBeEnabled();

    // A minute past the broadcast a fresh body without the name is the
    // withdrawal itself; nothing is broadcast again.
    await act(async () => {
      ref.current?.trigger();
      await vi.advanceTimersByTimeAsync(10);
    });
    expect(state.broadcasts).toEqual([true]);
    expect(getRecommendState("member1", "alice", "morning-light")).toEqual({ phase: "withdrawn" });
    expect(success).toHaveBeenCalledTimes(2);
  });

  it("a Withdraw from the parked state broadcasts again when route 5 still lists the viewer", async () => {
    let listsViewer = false;
    router.on(/curation-desk\/post\//, () =>
      makePost(row, { recommend_count: 4, recommenders: listsViewer ? [mine] : [] })
    );
    renderWithQueryClient(<CurationRecommendBtn author="alice" permlink="morning-light" alreadyRecommended />);
    await clickWithdraw();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(61_000);
    });
    expect(getRecommendState("member1", "alice", "morning-light")).toEqual({ phase: "confirming", withdraw: true });

    // The row is still on the chain, so the second withdrawal is the right call.
    listsViewer = true;
    await clickWithdraw();
    expect(state.broadcasts).toEqual([true, true]);
    expect(getRecommendState("member1", "alice", "morning-light").phase).toBe("pending");

    // And the fresh body that listed the name is the proof the new poll needs.
    listsViewer = false;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000);
    });
    expect(getRecommendState("member1", "alice", "morning-light")).toEqual({ phase: "withdrawn" });
  });

  it("a broadcast that resolves after the poll confirmed never downgrades the state", async () => {
    router.on(/curation-desk\/post\//, () => makePost(row, { recommend_count: 5, recommenders: [mine] }));
    // A HiveSigner redirect or a Keychain Mobile deep link resolves long after
    // the poll already read the chain.
    const gate = deferred<unknown>();
    state.result = () => gate.promise;

    renderWithQueryClient(<CurationRecommendBtn author="alice" permlink="morning-light" />);
    await act(async () => {
      fireEvent.click(screen.getByLabelText("curation-desk.recommend.aria"));
    });
    await act(async () => {
      fireEvent.click(screen.getByLabelText("curation-desk.recommend.confirm"));
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000);
    });
    expect(getRecommendState("member1", "alice", "morning-light")).toEqual({ phase: "recommended", confirmed: true });

    await act(async () => {
      gate.resolve({ tx_id: "f".repeat(40) });
      await vi.advanceTimersByTimeAsync(10);
    });
    expect(getRecommendState("member1", "alice", "morning-light")).toEqual({ phase: "recommended", confirmed: true });
    expect(screen.getByLabelText("curation-desk.recommend.withdraw-aria")).toBeInTheDocument();
  });

  it("keeps what the poll confirmed when the broadcast rejects afterwards", async () => {
    router.on(/curation-desk\/post\//, () => makePost(row, { recommend_count: 5, recommenders: [mine] }));
    // The signer window is still open while the poll reads the chain.
    const gate = deferred<unknown>();
    state.result = () => gate.promise;

    renderWithQueryClient(<CurationRecommendBtn author="alice" permlink="morning-light" />);
    await act(async () => {
      fireEvent.click(screen.getByLabelText("curation-desk.recommend.aria"));
    });
    await act(async () => {
      fireEvent.click(screen.getByLabelText("curation-desk.recommend.confirm"));
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000);
    });
    expect(getRecommendState("member1", "alice", "morning-light")).toEqual({ phase: "recommended", confirmed: true });

    // The rejection lands at 12 s, long after the operation reached the chain.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(7_000);
    });
    await act(async () => {
      gate.reject(new Error("signer window closed"));
      await vi.advanceTimersByTimeAsync(10);
    });

    // The viewer is told, and the row still says the chain has it: reverting
    // to idle would send the next click to broadcast a duplicate.
    expect(errorToast).toHaveBeenCalled();
    expect(getRecommendState("member1", "alice", "morning-light")).toEqual({ phase: "recommended", confirmed: true });
    expect(screen.getByLabelText("curation-desk.recommend.withdraw-aria")).toBeInTheDocument();
    expect(state.broadcasts).toEqual([false]);
  });

  it("never reads a body that carries no recommend_count as a count that dropped", async () => {
    // The later answer omits the field instead of counting zero, and lists
    // nobody either, so it says nothing about the withdrawal.
    let carriesCount = true;
    router.on(/curation-desk\/post\//, () => {
      const post = makePost(row, { recommend_count: 4, recommenders: [] });
      if (carriesCount) return post;
      const { recommend_count: _absent, ...rest } = post;
      return rest as CurationPost;
    });
    renderWithQueryClient(<CurationRecommendBtn author="alice" permlink="morning-light" alreadyRecommended />);
    await clickWithdraw();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000);
    });
    expect(getRecommendState("member1", "alice", "morning-light").phase).toBe("pending");

    carriesCount = false;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000);
    });
    expect(getRecommendState("member1", "alice", "morning-light").phase).toBe("pending");
  });
});
