// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * The unreads route must tag each channel with `unread_eligible`, mirroring the
 * muted / never-viewed guard it applies to the badge counts. The realtime
 * updater relies on this flag to avoid growing the badge for channels the
 * channel-list route keeps hidden (the phantom-unread bug).
 */

const mockMmUserFetch = vi.fn();
const mockFetchAllChannelPages = vi.fn();
const mockFetchAllChannelMemberPages = vi.fn();

vi.mock("@/server/mattermost", () => ({
  getMattermostTeamId: () => "team-123",
  getMattermostTokenFromCookies: () => Promise.resolve("test-token"),
  handleMattermostError: (err: unknown) => ({ error: String(err) }),
  mmUserFetch: (...args: unknown[]) => mockMmUserFetch(...args)
}));

vi.mock("@sentry/nextjs", () => ({
  withScope: vi.fn(),
  captureMessage: vi.fn()
}));

// Keep the real muted / never-viewed / unread-count helpers; stub only fetchers.
vi.mock("@/app/api/mattermost/channels/helpers", async () => ({
  ...(await vi.importActual("@/app/api/mattermost/channels/helpers")),
  fetchAllChannelPages: (...args: unknown[]) => mockFetchAllChannelPages(...args),
  fetchAllChannelMemberPages: (...args: unknown[]) => mockFetchAllChannelMemberPages(...args)
}));

const CHANNELS = [
  { id: "c-normal", type: "O", name: "normal", total_msg_count: 5 },
  { id: "c-read", type: "O", name: "read", total_msg_count: 3 },
  { id: "c-muted", type: "O", name: "muted", total_msg_count: 4 },
  { id: "c-neverviewed", type: "O", name: "nv", total_msg_count: 2 },
  { id: "c-neverviewed-zero", type: "O", name: "nvz", total_msg_count: 2 }
];

const MEMBERS = [
  { channel_id: "c-normal", mention_count: 1, msg_count: 1, last_viewed_at: 1000 },
  { channel_id: "c-read", mention_count: 0, msg_count: 3, last_viewed_at: 2000 },
  {
    channel_id: "c-muted",
    mention_count: 2,
    msg_count: 0,
    last_viewed_at: 3000,
    notify_props: { mark_unread: "mention" }
  },
  { channel_id: "c-neverviewed", mention_count: 0, msg_count: 0, last_viewed_at: null },
  { channel_id: "c-neverviewed-zero", mention_count: 0, msg_count: 0, last_viewed_at: 0 }
];

describe("channels/unreads route — unread_eligible flag", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchAllChannelPages.mockResolvedValue(CHANNELS);
    mockFetchAllChannelMemberPages.mockResolvedValue(MEMBERS);
    mockMmUserFetch.mockImplementation((path: string) => {
      if (path === "/users/me") return Promise.resolve({ id: "u-self" });
      if (path.includes("/threads")) return Promise.resolve({ threads: [] });
      if (path === "/users/ids") return Promise.resolve([]);
      return Promise.resolve([]);
    });
  });

  async function getChannels() {
    const { GET } = await import("@/app/api/mattermost/channels/unreads/route");
    const res = await GET();
    const body = await res.json();
    const byId: Record<string, { unread_eligible?: boolean; message_count: number }> = {};
    for (const c of body.channels as Array<{
      channelId: string;
      unread_eligible?: boolean;
      message_count: number;
    }>) {
      byId[c.channelId] = { unread_eligible: c.unread_eligible, message_count: c.message_count };
    }
    return byId;
  }

  it("marks a viewed channel with unread messages as eligible", async () => {
    const byId = await getChannels();
    expect(byId["c-normal"]).toEqual({ unread_eligible: true, message_count: 4 });
  });

  it("marks a fully-read channel as eligible with no unread", async () => {
    const byId = await getChannels();
    expect(byId["c-read"]).toEqual({ unread_eligible: true, message_count: 0 });
  });

  it("marks a muted channel ineligible and zeroed", async () => {
    const byId = await getChannels();
    expect(byId["c-muted"]).toEqual({ unread_eligible: false, message_count: 0 });
  });

  it("marks never-viewed channels ineligible (last_viewed_at null and 0)", async () => {
    const byId = await getChannels();
    expect(byId["c-neverviewed"]).toEqual({ unread_eligible: false, message_count: 0 });
    expect(byId["c-neverviewed-zero"]).toEqual({ unread_eligible: false, message_count: 0 });
  });
});
