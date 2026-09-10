import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithQueryClient } from "@/specs/test-utils";
import { installFetchRouter, iso, jsonResponse, makeRoster } from "./curation-test-utils";

const state = vi.hoisted(() => ({ username: "good-karma" as string | undefined }));

vi.mock("@ecency/sdk", async () => ({
  ...(await vi.importActual<Record<string, unknown>>("@ecency/sdk")),
}));
vi.mock("@/utils", async () => ({
  ...(await vi.importActual<Record<string, unknown>>("@/utils")),
  ensureValidToken: vi.fn(async () => "code-1"),
  getAccessToken: vi.fn(() => "code-1"),
}));
vi.mock("@/core/hooks/use-active-username", () => ({ useActiveUsername: () => state.username }));
vi.mock("@/core/hooks/use-active-account", () => ({
  useActiveAccount: () => ({
    activeUser: state.username ? { username: state.username } : null,
    account: null,
    isLoading: false,
  }),
}));
vi.mock("@/features/shared/feedback", () => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("@/api/format-error", () => ({ formatError: (e: unknown) => [String(e), "common"] }));

import { CurationRosterView } from "@/features/curation-desk/curation-roster-view";

function adminRow(username: string, extra: Record<string, unknown> = {}) {
  return {
    username,
    role: "curator",
    active: true,
    trail: true,
    rules: {},
    added_by: "good-karma",
    added_at: iso(-86_400_000),
    removed_at: null,
    note: null,
    ...extra,
  };
}

const LIST = {
  curators: [
    adminRow("good-karma", { role: "admin", trail: false }),
    adminRow("incublus", {
      role: "mod",
      trail: false,
      rules: { trail: false },
      note: "mod only, votes not trailed",
    }),
    adminRow("untilwelearn", { role: "mod", rules: { min_weight: 1090 } }),
    adminRow("dunsky", { removed_at: iso(-3_600_000), active: false }),
  ],
};

/**
 * The roster panel is the single place a curator is added, changed or retired.
 * erobot reads the same rows to build the lists that used to live in its
 * config.js, so what this screen writes is what the vote trail does.
 */
describe("CurationRosterView", () => {
  let router: ReturnType<typeof installFetchRouter>;

  beforeEach(() => {
    state.username = "good-karma";
    router = installFetchRouter();
    // The viewer's role comes from the public roster; the panel's rows come from
    // the admin list, which is where the private fields live.
    router.on(/curation-desk\/roster$/, () =>
      jsonResponse({
        curators: [{ username: "good-karma", role: "admin", active: true, rules: null }],
        updated_at: iso(0),
      })
    );
    router.on(/curation-desk\/roster-list$/, () => jsonResponse(LIST));
  });

  afterEach(() => vi.unstubAllGlobals());

  it("shows who is trailed, which is not the same as who is a mod", async () => {
    renderWithQueryClient(<CurationRosterView />);
    await waitFor(() => expect(screen.getByText("@untilwelearn")).toBeInTheDocument());
    // incublus is a mod whose votes are deliberately not trailed: exactly the case
    // that could not be expressed while followAccounts and mods were two arrays.
    const incublus = screen.getByText("@incublus").closest("li")!;
    expect(incublus).toHaveTextContent("curation-desk.roster.not-trailed");
    const untilwelearn = screen.getByText("@untilwelearn").closest("li")!;
    expect(untilwelearn).toHaveTextContent("curation-desk.roster.trailed");
  });

  it("keeps a retired curator out of the active list and offers to bring them back", async () => {
    renderWithQueryClient(<CurationRosterView />);
    await waitFor(() => expect(screen.getByText("@dunsky")).toBeInTheDocument());
    expect(screen.getByText("curation-desk.roster.retired-heading")).toBeInTheDocument();
    const dunsky = screen.getByText("@dunsky").closest("li")!;
    expect(within(dunsky).getByText("curation-desk.roster.bring-back")).toBeInTheDocument();
    // and no retire control on a row that is already retired
    expect(within(dunsky).queryByText("curation-desk.roster.retire")).toBeNull();
  });

  it("retires only after a confirm, and sends just the curator", async () => {
    const writes: Record<string, unknown>[] = [];
    router.on(/curation-desk\/roster-retire$/, (_url: string, init: RequestInit) => {
      writes.push(JSON.parse(String(init.body)));
      return jsonResponse({ ok: true, curator: "untilwelearn" });
    });
    renderWithQueryClient(<CurationRosterView />);
    await waitFor(() => expect(screen.getByText("@untilwelearn")).toBeInTheDocument());
    const row = screen.getByText("@untilwelearn").closest("li")!;

    fireEvent.click(within(row).getByText("curation-desk.roster.retire"));
    expect(writes).toHaveLength(0);
    fireEvent.click(within(row).getByText("curation-desk.roster.confirm-retire"));
    await waitFor(() => expect(writes).toHaveLength(1));
    expect(writes[0]).toMatchObject({ curator: "untilwelearn", code: "code-1" });
  });

  it("writes trail only when it differs from the role default", async () => {
    const writes: Record<string, unknown>[] = [];
    router.on(/curation-desk\/roster-set$/, (_url: string, init: RequestInit) => {
      writes.push(JSON.parse(String(init.body)));
      return jsonResponse({ curator: adminRow("newbie") });
    });
    renderWithQueryClient(<CurationRosterView />);
    await waitFor(() => expect(screen.getByText("@untilwelearn")).toBeInTheDocument());

    fireEvent.click(screen.getByText("curation-desk.roster.add"));
    fireEvent.change(screen.getByLabelText("curation-desk.roster.username"), {
      target: { value: "newbie" },
    });
    fireEvent.click(screen.getByText("curation-desk.roster.add"));
    await waitFor(() => expect(writes).toHaveLength(1));
    // A curator is trailed by default, so the row says nothing about trailing and
    // the default stays defined in one place, the backend.
    expect(writes[0].rules).toBeUndefined();

    fireEvent.click(screen.getByText("curation-desk.roster.add"));
    fireEvent.change(screen.getByLabelText("curation-desk.roster.username"), {
      target: { value: "quiet" },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByText("curation-desk.roster.add"));
    await waitFor(() => expect(writes).toHaveLength(2));
    expect(writes[1].rules).toEqual({ trail: false });
  });

  it("refuses a bad account name and a weight outside the vote range before any request", async () => {
    const writes: unknown[] = [];
    router.on(/curation-desk\/roster-set$/, (_url: string, init: RequestInit) => {
      writes.push(JSON.parse(String(init.body)));
      return jsonResponse({ curator: adminRow("x") });
    });
    renderWithQueryClient(<CurationRosterView />);
    await waitFor(() => expect(screen.getByText("@untilwelearn")).toBeInTheDocument());

    fireEvent.click(screen.getByText("curation-desk.roster.add"));
    fireEvent.change(screen.getByLabelText("curation-desk.roster.username"), {
      target: { value: "no" },
    });
    fireEvent.click(screen.getByText("curation-desk.roster.add"));
    await waitFor(() => expect(writes).toHaveLength(0));

    fireEvent.change(screen.getByLabelText("curation-desk.roster.username"), {
      target: { value: "goodname" },
    });
    fireEvent.change(screen.getByLabelText("curation-desk.roster.label-min-weight"), {
      target: { value: "20000" },
    });
    fireEvent.click(screen.getByText("curation-desk.roster.add"));
    await waitFor(() => expect(writes).toHaveLength(0));
  });

  it("is closed to anyone who is not an admin", async () => {
    state.username = "mod1";
    router.on(/curation-desk\/roster$/, () => jsonResponse(makeRoster(["mod1"])));
    renderWithQueryClient(<CurationRosterView />);
    await waitFor(() =>
      expect(screen.getByText("curation-desk.roster.admins-only")).toBeInTheDocument()
    );
    // and the private list is never even asked for
    expect(router.callsTo(/roster-list/)).toHaveLength(0);
  });
});
