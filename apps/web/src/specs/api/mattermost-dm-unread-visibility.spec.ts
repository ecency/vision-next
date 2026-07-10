// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Regression test: a DM that contributes to the unread badge must stay visible
 * in the channel list.
 *
 * The unread badge (channels/unreads/route.ts) counts a DM's unread messages
 * regardless of the `direct_channel_show` preference. The channel list route
 * used to hide any DM with `direct_channel_show=false`, so a closed DM that
 * later received a message produced a "phantom" badge: a count with no row to
 * open and clear. The list route now keeps such a DM visible.
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

// Keep the real badge/never-viewed predicates (the route now imports
// dmContributesToUnreadBadge from here); only the network fetchers are stubbed.
vi.mock("@/app/api/mattermost/channels/helpers", async () => ({
  ...(await vi.importActual("@/app/api/mattermost/channels/helpers")),
  fetchAllChannelPages: (...args: unknown[]) => mockFetchAllChannelPages(...args),
  fetchAllChannelMemberPages: (...args: unknown[]) => mockFetchAllChannelMemberPages(...args)
}));

// Five closed DMs (direct_channel_show=false), each exercising one branch of the
// "contributes to badge" rule.
const CHANNELS = [
  // unread + viewed + not muted -> contributes -> must stay visible
  { id: "dm-unread", name: "u-self__u-other", display_name: "", type: "D", total_msg_count: 5 },
  // read (msg_count == total) -> no unread -> stays hidden
  { id: "dm-read", name: "u-self__u-read", display_name: "", type: "D", total_msg_count: 3 },
  // muted with unread -> badge zeroes muted -> stays hidden
  { id: "dm-muted", name: "u-self__u-muted", display_name: "", type: "D", total_msg_count: 4 },
  // never viewed (last_viewed_at null) -> badge skips never-viewed -> stays hidden
  { id: "dm-neverviewed", name: "u-self__u-new", display_name: "", type: "D", total_msg_count: 2 },
  // never viewed (last_viewed_at 0, Mattermost's other "never" value) -> stays hidden
  { id: "dm-neverviewed-zero", name: "u-self__u-zero", display_name: "", type: "D", total_msg_count: 2 }
];

const MEMBERS = [
  { user_id: "u-self", channel_id: "dm-unread", mention_count: 4, msg_count: 1, last_viewed_at: 1000 },
  { user_id: "u-self", channel_id: "dm-read", mention_count: 0, msg_count: 3, last_viewed_at: 2000 },
  {
    user_id: "u-self",
    channel_id: "dm-muted",
    mention_count: 2,
    msg_count: 0,
    last_viewed_at: 3000,
    notify_props: { mark_unread: "mention" }
  },
  { user_id: "u-self", channel_id: "dm-neverviewed", mention_count: 0, msg_count: 0, last_viewed_at: null },
  { user_id: "u-self", channel_id: "dm-neverviewed-zero", mention_count: 0, msg_count: 0, last_viewed_at: 0 }
];

const PREFERENCES = [
  { user_id: "u-self", category: "direct_channel_show", name: "u-other", value: "false" },
  { user_id: "u-self", category: "direct_channel_show", name: "u-read", value: "false" },
  { user_id: "u-self", category: "direct_channel_show", name: "u-muted", value: "false" },
  { user_id: "u-self", category: "direct_channel_show", name: "u-new", value: "false" },
  { user_id: "u-self", category: "direct_channel_show", name: "u-zero", value: "false" }
];

const DM_USERS = [
  { id: "u-other", username: "other", delete_at: 0 },
  { id: "u-read", username: "readpartner", delete_at: 0 },
  { id: "u-muted", username: "mutedpartner", delete_at: 0 },
  { id: "u-new", username: "newpartner", delete_at: 0 },
  { id: "u-zero", username: "zeropartner", delete_at: 0 }
];

describe("channels route — DM unread visibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchAllChannelPages.mockResolvedValue(CHANNELS);
    mockFetchAllChannelMemberPages.mockResolvedValue(MEMBERS);
    mockMmUserFetch.mockImplementation((path: string) => {
      if (path === "/users/me") return Promise.resolve({ id: "u-self", username: "self" });
      if (path.includes("/channels/categories")) return Promise.resolve({ categories: [], order: [] });
      if (path === "/users/me/preferences") return Promise.resolve(PREFERENCES);
      if (path === "/users/ids") return Promise.resolve(DM_USERS);
      return Promise.resolve([]);
    });
  });

  async function getChannelIds() {
    const { GET } = await import("@/app/api/mattermost/channels/route");
    const res = await GET();
    const body = await res.json();
    return (body.channels as { id: string }[]).map((c) => c.id);
  }

  it("keeps a closed DM visible when it has unread messages", async () => {
    const ids = await getChannelIds();
    expect(ids).toContain("dm-unread");
  });

  it("still hides a closed DM that has been read", async () => {
    const ids = await getChannelIds();
    expect(ids).not.toContain("dm-read");
  });

  it("does not force-show a muted DM (excluded from the badge)", async () => {
    const ids = await getChannelIds();
    expect(ids).not.toContain("dm-muted");
  });

  it("does not force-show a never-viewed DM (excluded from the badge)", async () => {
    const ids = await getChannelIds();
    expect(ids).not.toContain("dm-neverviewed");
  });

  it("treats last_viewed_at of 0 as never-viewed and keeps it hidden", async () => {
    const ids = await getChannelIds();
    expect(ids).not.toContain("dm-neverviewed-zero");
  });
});
