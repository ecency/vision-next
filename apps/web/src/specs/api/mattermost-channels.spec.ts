import { describe, it, expect, vi, beforeEach } from "vitest";

const mockMmUserFetch = vi.fn();

vi.mock("@/server/mattermost", () => ({
  getMattermostTeamId: () => "team-123",
  getMattermostTokenFromCookies: () => Promise.resolve("test-token"),
  handleMattermostError: (err: unknown) => ({ error: String(err) }),
  mmUserFetch: (...args: unknown[]) => mockMmUserFetch(...args)
}));

function makeChannels(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `ch-${i}`,
    name: `channel-${i}`,
    display_name: `Channel ${i}`,
    type: "O"
  }));
}

describe("fetchAllChannelPages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("aggregates results from multiple pages and stops on short page", async () => {
    const { fetchAllChannelPages, pageSize } = await import(
      "@/app/api/mattermost/channels/helpers"
    );
    const fullPage = makeChannels(pageSize);
    const shortPage = makeChannels(50);

    mockMmUserFetch
      .mockResolvedValueOnce(fullPage)
      .mockResolvedValueOnce(shortPage);

    const result = await fetchAllChannelPages("test-token");

    expect(result).toHaveLength(pageSize + 50);
    expect(mockMmUserFetch).toHaveBeenCalledTimes(2);
    expect(mockMmUserFetch).toHaveBeenCalledWith(
      expect.stringContaining("page=0"),
      "test-token"
    );
    expect(mockMmUserFetch).toHaveBeenCalledWith(
      expect.stringContaining("page=1"),
      "test-token"
    );
  });

  it("stops after a single call when first page is short", async () => {
    const { fetchAllChannelPages } = await import(
      "@/app/api/mattermost/channels/helpers"
    );
    const shortPage = makeChannels(10);
    mockMmUserFetch.mockResolvedValueOnce(shortPage);

    const result = await fetchAllChannelPages("test-token");

    expect(result).toHaveLength(10);
    expect(mockMmUserFetch).toHaveBeenCalledTimes(1);
  });

  it("stops at maxPages even if every page is full", async () => {
    const { fetchAllChannelPages, pageSize, maxPages } = await import(
      "@/app/api/mattermost/channels/helpers"
    );
    const fullPage = makeChannels(pageSize);
    for (let i = 0; i < maxPages; i++) {
      mockMmUserFetch.mockResolvedValueOnce(fullPage);
    }

    const result = await fetchAllChannelPages("test-token");

    expect(result).toHaveLength(pageSize * maxPages);
    expect(mockMmUserFetch).toHaveBeenCalledTimes(maxPages);
  });
});
