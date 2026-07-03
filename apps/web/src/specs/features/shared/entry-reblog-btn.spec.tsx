import React from "react";
import { fireEvent, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  mockEntry,
  renderWithQueryClient,
  setupModalContainers,
  cleanupModalContainers
} from "@/specs/test-utils";
import type { Entry } from "@/entities";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// The component imports `LoginRequired` from the heavy `@/features/shared`
// barrel (68 re-exports). Re-export the REAL LoginRequired implementation from
// its own module so we exercise its genuine logged-out behavior, while stubbing
// the rest of the barrel to avoid pulling unrelated transitive dependencies.
vi.mock("@/features/shared", async () => {
  const real = await vi.importActual<typeof import("@/features/shared/login-required")>(
    "@/features/shared/login-required"
  );
  return { LoginRequired: real.LoginRequired };
});

// LoginRequired reads the global store only to grab `toggleUiProp` (open the
// login modal). Mock the store so a logged-out click is observable and we don't
// boot the full zustand graph.
const toggleUiProp = vi.fn();
vi.mock("@/core/global-store", () => ({
  useGlobalStore: (selector: (s: any) => any) => selector({ toggleUiProp })
}));

// `useActiveAccount` is globally mocked to return a logged-OUT user; individual
// tests override it via this handle to simulate a logged-in user.
import { useActiveAccount } from "@/core/hooks/use-active-account";
const mockUseActiveAccount = vi.mocked(useActiveAccount);

// Reblog count / list cache: the real implementation spreads
// getPostQueryOptions() from the (mocked) SDK which would explode, so stub the
// cache management to surface the passed entry as the query's data.
vi.mock("@/core/caches", () => ({
  EcencyEntriesCacheManagement: {
    getEntryQuery: (entry: Entry) => ({
      queryKey: ["entry", entry?.author, entry?.permlink],
      queryFn: () => entry,
      initialData: entry,
      enabled: !!entry
    })
  }
}));

// The SDK reblogs query is not part of the global SDK mock — provide it here.
// `reblogsFixture` lets each test control which posts the active user has
// already reblogged.
let reblogsFixture: { author: string; permlink: string }[] = [];
vi.mock("@ecency/sdk", () => ({
  getReblogsQueryOptions: (username?: string) => ({
    queryKey: ["reblogs", username],
    queryFn: () => reblogsFixture,
    initialData: reblogsFixture,
    enabled: !!username
  })
}));

// The reblog mutation hook — capture calls to assert the confirm flow fires it
// with the correct `isDelete` flag.
const reblogMutate = vi.fn().mockResolvedValue(undefined);
let reblogPending = false;
vi.mock("@/api/mutations", () => ({
  useEntryReblog: () => ({ mutateAsync: reblogMutate, isPending: reblogPending })
}));

// `PopoverConfirm` (from the @/features/ui barrel) wraps the trigger in a
// floating-ui positioned popover. We're testing EntryReblogBtn's wiring, not
// the popover internals, so replace it with a deterministic stand-in that
// preserves its real contract:
// render the trigger child and an OK button that invokes `onConfirm`. The
// captured props let us assert the component supplies the correct confirm
// title / ok text / variant for the (un)reblog states.
const popoverConfirmProps: Record<string, any> = {};
vi.mock("@/features/ui", () => ({
  PopoverConfirm: ({ children, onConfirm, titleText, okText, okVariant }: any) => {
    popoverConfirmProps.titleText = titleText;
    popoverConfirmProps.okText = okText;
    popoverConfirmProps.okVariant = okVariant;
    return (
      <div data-testid="popover-confirm">
        {children}
        <button type="button" data-testid="confirm-ok" onClick={() => onConfirm?.()}>
          {okText}
        </button>
      </div>
    );
  }
}));

import { EntryReblogBtn } from "@/features/shared/entry-reblog-btn";

function asLoggedIn(username = "alice") {
  mockUseActiveAccount.mockReturnValue({
    activeUser: { username, data: {} as any },
    username,
    account: null,
    isLoading: false,
    isPending: false,
    isError: false,
    isSuccess: true,
    error: null,
    refetch: vi.fn()
  } as any);
}

describe("EntryReblogBtn", () => {
  beforeEach(() => {
    setupModalContainers();
    reblogsFixture = [];
    reblogPending = false;
    reblogMutate.mockClear();
    toggleUiProp.mockClear();
    Object.keys(popoverConfirmProps).forEach((k) => delete popoverConfirmProps[k]);
    mockUseActiveAccount.mockReset();
    // Default: logged-out user (matches the global mock contract).
    mockUseActiveAccount.mockReturnValue({
      activeUser: null,
      username: null,
      account: null,
      isLoading: false,
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
      refetch: vi.fn()
    } as any);
  });

  afterEach(() => {
    cleanupModalContainers();
    vi.clearAllMocks();
  });

  it("shows the reblog count from the entry when greater than zero", () => {
    asLoggedIn();
    const entry = mockEntry({ author: "alice", permlink: "post", reblogs: 7 } as Partial<Entry>);
    const { container } = renderWithQueryClient(<EntryReblogBtn entry={entry} />);

    expect(within(container).getByText("7")).toBeInTheDocument();
  });

  it("renders no count text when the entry has zero reblogs", () => {
    asLoggedIn();
    const entry = mockEntry({ author: "alice", permlink: "post", reblogs: 0 } as Partial<Entry>);
    const { container } = renderWithQueryClient(<EntryReblogBtn entry={entry} />);

    expect(within(container).queryByText("0")).not.toBeInTheDocument();
  });

  it("labels the button with the reblog tooltip key when not yet reblogged", () => {
    asLoggedIn("alice");
    // reblogsFixture empty -> not reblogged
    const entry = mockEntry({ author: "bob", permlink: "post" } as Partial<Entry>);
    const { container } = renderWithQueryClient(<EntryReblogBtn entry={entry} />);

    // Tooltip clones the <a> and sets aria-label/title to the (mocked) i18n key.
    const link = container.querySelector("a.inner-btn") as HTMLElement;
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("aria-label", "entry-reblog.reblog");
    // Not-reblogged container styling.
    const wrapper = container.querySelector(".entry-reblog-btn") as HTMLElement;
    expect(wrapper).not.toHaveClass("reblogged");
  });

  it("marks the button as reblogged when the active user already reblogged the entry", () => {
    asLoggedIn("alice");
    reblogsFixture = [{ author: "bob", permlink: "post" }];
    const entry = mockEntry({ author: "bob", permlink: "post" } as Partial<Entry>);
    const { container } = renderWithQueryClient(<EntryReblogBtn entry={entry} />);

    const wrapper = container.querySelector(".entry-reblog-btn") as HTMLElement;
    expect(wrapper).toHaveClass("reblogged");
    const link = container.querySelector("a.inner-btn") as HTMLElement;
    expect(link).toHaveAttribute("aria-label", "entry-reblog.delete-reblog");
  });

  it("applies the in-progress class while a reblog is pending", () => {
    asLoggedIn("alice");
    reblogPending = true;
    const entry = mockEntry({ author: "bob", permlink: "post" } as Partial<Entry>);
    const { container } = renderWithQueryClient(<EntryReblogBtn entry={entry} />);

    const wrapper = container.querySelector(".entry-reblog-btn") as HTMLElement;
    expect(wrapper).toHaveClass("in-progress");
  });

  it("opens the login modal instead of reblogging when logged out", () => {
    // default beforeEach state = logged out
    const entry = mockEntry({ author: "bob", permlink: "post", reblogs: 3 } as Partial<Entry>);
    const { container } = renderWithQueryClient(<EntryReblogBtn entry={entry} />);

    // Control is still visible (promptOnAnon keeps it rendered).
    const link = container.querySelector("a.inner-btn") as HTMLElement;
    expect(link).toBeInTheDocument();
    expect(within(container).getByText("3")).toBeInTheDocument();

    fireEvent.click(link);

    // Anonymous activation routes to the login modal and never the reblog.
    expect(toggleUiProp).toHaveBeenCalledWith("login");
    expect(reblogMutate).not.toHaveBeenCalled();
  });

  it("wires a fresh-reblog confirmation and fires the mutation with isDelete=false", () => {
    asLoggedIn("alice");
    const entry = mockEntry({ author: "bob", permlink: "post" } as Partial<Entry>);
    renderWithQueryClient(<EntryReblogBtn entry={entry} />);

    // Logged-in users get the confirm popover (not the LoginRequired wrapper).
    expect(screen.getByTestId("popover-confirm")).toBeInTheDocument();
    // Confirm dialog copy reflects the "add reblog" (primary) action.
    expect(popoverConfirmProps.okText).toBe("entry-reblog.confirm-ok");
    expect(popoverConfirmProps.titleText).toBe("entry-reblog.confirm-title");
    expect(popoverConfirmProps.okVariant).toBe("primary");

    fireEvent.click(screen.getByTestId("confirm-ok"));

    expect(reblogMutate).toHaveBeenCalledTimes(1);
    expect(reblogMutate).toHaveBeenCalledWith({ isDelete: false });
    // Logged-in confirm path must NOT open the login modal.
    expect(toggleUiProp).not.toHaveBeenCalled();
  });

  it("wires an un-reblog confirmation and fires the mutation with isDelete=true", () => {
    asLoggedIn("alice");
    reblogsFixture = [{ author: "bob", permlink: "post" }];
    const entry = mockEntry({ author: "bob", permlink: "post" } as Partial<Entry>);
    renderWithQueryClient(<EntryReblogBtn entry={entry} />);

    // Already reblogged -> destructive (danger) confirm copy.
    expect(popoverConfirmProps.okText).toBe("entry-reblog.delete-confirm-ok");
    expect(popoverConfirmProps.titleText).toBe("entry-reblog.delete-confirm-title");
    expect(popoverConfirmProps.okVariant).toBe("danger");

    fireEvent.click(screen.getByTestId("confirm-ok"));

    expect(reblogMutate).toHaveBeenCalledTimes(1);
    expect(reblogMutate).toHaveBeenCalledWith({ isDelete: true });
  });
});
