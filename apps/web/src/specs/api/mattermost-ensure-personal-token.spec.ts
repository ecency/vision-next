import { describe, it, expect, vi, beforeEach } from "vitest";

// ensurePersonalToken now returns BOTH the PAT and the user record it
// already fetched internally. The bootstrap route reads user.props for
// left-channels — folding the read in here saves an extra MM round-trip
// on the hot path, where stacked sequential calls used to push past the
// upstream timeout for users with many community subscriptions.

function resp(status: number, body: unknown) {
  const text = typeof body === "string" ? body : JSON.stringify(body);
  return { ok: status >= 200 && status < 300, status, text: async () => text };
}

async function loadModule() {
  process.env.MATTERMOST_BASE_URL = "https://chat.test/api/v4";
  process.env.MATTERMOST_ADMIN_TOKEN = "admin-token";
  process.env.MATTERMOST_TEAM_ID = "team-1";
  vi.resetModules();
  return await import("@/server/mattermost");
}

describe("ensurePersonalToken — returns token + user (parallelization contract)", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("returns the stored token alongside the user when the PAT is still valid", async () => {
    const { ensurePersonalToken } = await loadModule();
    const userWithPat = {
      id: "u-1",
      username: "alice",
      email: "a",
      delete_at: 0,
      props: {
        ecency_pat: "stored-pat",
        ecency_left_channels: JSON.stringify(["hive-old"])
      }
    };
    fetchMock
      .mockResolvedValueOnce(resp(200, userWithPat)) // GET /users/u-1
      .mockResolvedValueOnce(resp(200, { id: "u-1" })); // GET /users/me (isTokenValid)

    const result = await ensurePersonalToken("u-1");

    expect(result.token).toBe("stored-pat");
    expect(result.user).toEqual(userWithPat);
    // Caller relies on this user to feed getUserLeftChannels without a
    // separate GET /users/{id} — regression-guard the shape.
    expect(result.user.props?.ecency_left_channels).toBe(JSON.stringify(["hive-old"]));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("creates a new token and still returns the user when no PAT is stored", async () => {
    const { ensurePersonalToken } = await loadModule();
    const userWithoutPat = {
      id: "u-2",
      username: "bob",
      email: "b",
      delete_at: 0,
      props: { ecency_left_channels: JSON.stringify(["hive-x"]) }
    };
    fetchMock
      .mockResolvedValueOnce(resp(200, userWithoutPat)) // initial GET in ensurePersonalToken
      .mockResolvedValueOnce(resp(200, { token: "new-pat" })) // POST /users/u-2/tokens
      .mockResolvedValueOnce(resp(200, userWithoutPat)) // GET again (createToken re-reads for prop merge)
      .mockResolvedValueOnce(resp(200, "")); // PUT /users/u-2/patch

    const result = await ensurePersonalToken("u-2");

    expect(result.token).toBe("new-pat");
    // The returned user predates the prop merge, which is intentional: the
    // only consumer (getUserLeftChannels) doesn't read the PAT prop.
    expect(result.user.id).toBe("u-2");
    expect(result.user.props?.ecency_left_channels).toBe(JSON.stringify(["hive-x"]));
  });

  it("creates a new token when the stored PAT is rejected as 401", async () => {
    const { ensurePersonalToken } = await loadModule();
    const userWithStalePat = {
      id: "u-3",
      username: "carol",
      email: "c",
      delete_at: 0,
      props: { ecency_pat: "stale" }
    };
    fetchMock
      .mockResolvedValueOnce(resp(200, userWithStalePat)) // GET /users/u-3
      .mockResolvedValueOnce(resp(401, { id: "api.auth" })) // isTokenValid → 401
      .mockResolvedValueOnce(resp(200, { token: "fresh-pat" })) // POST tokens
      .mockResolvedValueOnce(resp(200, userWithStalePat)) // createToken re-read
      .mockResolvedValueOnce(resp(200, "")); // PUT patch

    const result = await ensurePersonalToken("u-3");

    expect(result.token).toBe("fresh-pat");
    expect(result.user.id).toBe("u-3");
  });

  it("surfaces non-auth errors from token validation (5xx must not silently re-create)", async () => {
    const { ensurePersonalToken } = await loadModule();
    fetchMock
      .mockResolvedValueOnce(resp(200, {
        id: "u-4",
        username: "dave",
        email: "d",
        delete_at: 0,
        props: { ecency_pat: "some-pat" }
      }))
      .mockResolvedValueOnce(resp(500, "mm exploded"));

    await expect(ensurePersonalToken("u-4")).rejects.toThrow(/500|mm exploded/);
    // No POST /users/u-4/tokens should fire — a 5xx on isTokenValid is NOT
    // grounds to mint a duplicate token.
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
