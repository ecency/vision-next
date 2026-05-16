import { describe, it, expect, vi, beforeEach } from "vitest";

// ensureMattermostUser must be idempotent: a concurrent/repeat bootstrap
// (common with browser-extension integrations) can create the MM user
// between the username lookup and the create POST. Mattermost then returns
// 400 app.user.save.username_exists.app_error. That benign race must NOT
// surface as an error (the bootstrap route maps it to a 502) — it should
// re-fetch the now-existing user and return it.

function resp(status: number, body: unknown) {
  const text = typeof body === "string" ? body : JSON.stringify(body);
  return { ok: status >= 200 && status < 300, status, text: async () => text };
}

const USERNAME_EXISTS = {
  id: "app.user.save.username_exists.app_error",
  message: "An account with that username already exists.",
  detailed_error: "",
  status_code: 400
};

async function loadModule() {
  process.env.MATTERMOST_BASE_URL = "https://chat.test/api/v4";
  process.env.MATTERMOST_ADMIN_TOKEN = "admin-token";
  process.env.MATTERMOST_TEAM_ID = "team-1";
  vi.resetModules();
  return await import("@/server/mattermost");
}

describe("ensureMattermostUser — idempotency / concurrent-create race", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("returns the existing user when create races into username_exists", async () => {
    const { ensureMattermostUser } = await loadModule();
    fetchMock
      .mockResolvedValueOnce(resp(404, "user not found")) // GET /users/username
      .mockResolvedValueOnce(resp(400, USERNAME_EXISTS)) // POST /users (lost the race)
      .mockResolvedValueOnce(
        resp(200, { id: "u-1", username: "alice", email: "a", delete_at: 0 })
      ); // GET /users/username (re-fetch)

    const user = await ensureMattermostUser("alice");

    expect(user).toEqual({ id: "u-1", username: "alice", email: "a", delete_at: 0 });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("reactivates the existing user if the raced-in account was deactivated", async () => {
    const { ensureMattermostUser } = await loadModule();
    fetchMock
      .mockResolvedValueOnce(resp(404, "nf"))
      .mockResolvedValueOnce(resp(400, USERNAME_EXISTS))
      .mockResolvedValueOnce(
        resp(200, { id: "u-2", username: "carol", email: "c", delete_at: 1700000000000 })
      )
      .mockResolvedValueOnce(resp(200, "")); // PUT /users/u-2/active

    const user = await ensureMattermostUser("carol");

    expect(user.id).toBe("u-2");
    expect(user.delete_at).toBe(0);
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(fetchMock.mock.calls[3][0]).toContain("/users/u-2/active");
  });

  it("does not create when the user already exists (happy path unchanged)", async () => {
    const { ensureMattermostUser } = await loadModule();
    fetchMock.mockResolvedValueOnce(
      resp(200, { id: "u-9", username: "bob", email: "b", delete_at: 0 })
    );

    const user = await ensureMattermostUser("bob");

    expect(user.id).toBe("u-9");
    expect(fetchMock).toHaveBeenCalledTimes(1); // no POST /users
  });

  it("still throws on non-username_exists create errors", async () => {
    const { ensureMattermostUser } = await loadModule();
    fetchMock
      .mockResolvedValueOnce(resp(404, "nf"))
      .mockResolvedValueOnce(
        resp(400, { id: "app.user.save.email_exists.app_error", message: "email exists" })
      );

    await expect(ensureMattermostUser("dave")).rejects.toThrow(
      /Mattermost request failed \(400\)/
    );
    expect(fetchMock).toHaveBeenCalledTimes(2); // no idempotent re-fetch
  });
});
