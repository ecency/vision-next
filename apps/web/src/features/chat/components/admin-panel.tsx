import { Button } from "@ui/button";
import type { useChannelAdmin } from "../hooks/use-channel-admin";

interface AdminPanelProps {
  admin: ReturnType<typeof useChannelAdmin>;
}

export function AdminPanel({ admin }: AdminPanelProps) {
  const {
    adminUsername,
    setAdminUsername,
    banHours,
    setBanHours,
    adminMessage,
    setAdminMessage,
    adminError,
    setAdminError,
    adminUserSearch,
    banUserMutation,
    deleteUserPostsMutation,
    deleteUserDmPostsMutation,
    deleteUserAccountMutation,
    nukeUserMutation,
    handleBanUser,
    handleDeleteAllPosts,
    handleDeleteAllDmPosts,
    handleDeleteUserAccount,
    handleNukeUser
  } = admin;

  return (
    <div className="mt-3 space-y-3 rounded border border-[--border-color] bg-[--surface-color] p-4">
      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-sm font-semibold">Chat admin tools</div>
          <div className="text-xs text-[--text-muted]">
            Ban users or delete their posts across channels as @ecency.
          </div>
          <button
            onClick={async () => {
              try {
                const res = await fetch("/api/mattermost/admin/check-permissions");
                const data = await res.json();
                if (data.error) {
                  setAdminError(`Permission check failed: ${data.error}`);
                } else {
                  setAdminMessage(data.message);
                  console.log("Admin permissions:", data);
                }
              } catch (err) {
                setAdminError("Failed to check permissions");
              }
            }}
            className="mt-1 text-xs text-blue-500 hover:underline"
          >
            Check admin permissions
          </button>
        </div>
        <div className="flex flex-col gap-1 text-xs md:items-end">
          {adminMessage && <div className="text-green-600 whitespace-pre-wrap">{adminMessage}</div>}
          {adminError && <div className="text-red-500 whitespace-pre-wrap">{adminError}</div>}
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <div className="flex w-full flex-col gap-1 md:w-1/3">
          <label className="text-xs font-semibold text-[--text-muted]" htmlFor="admin-username">
            Target username
          </label>
          <input
            id="admin-username"
            className="w-full rounded-lg border border-[--border-color] bg-white px-3 py-2 text-sm focus:border-blue-dark-sky focus:outline-none"
            placeholder="exampleuser"
            value={adminUsername}
            onChange={(e) => setAdminUsername(e.target.value)}
          />
          {adminUserSearch.data?.users?.length ? (
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-[--text-muted]">
              <span>Suggestions:</span>
              {adminUserSearch.data.users.slice(0, 5).map((user) => (
                <button
                  key={user.id}
                  type="button"
                  className="rounded-full border border-[--border-color] px-2 py-1 hover:border-blue-dark-sky hover:text-blue-dark-sky"
                  onClick={() => setAdminUsername(user.username || "")}
                >
                  @{user.username}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-1 md:w-48">
          <label className="text-xs font-semibold text-[--text-muted]" htmlFor="ban-hours">
            Ban duration (hours)
          </label>
          <input
            id="ban-hours"
            type="number"
            min={0}
            className="w-full rounded-lg border border-[--border-color] bg-white px-3 py-2 text-sm focus:border-blue-dark-sky focus:outline-none"
            value={banHours}
            onChange={(e) => setBanHours(e.target.value)}
          />
          <div className="text-[11px] text-[--text-muted]">Use 0 to lift a ban</div>
        </div>

        <div className="flex flex-wrap gap-2 md:ml-auto">
          <Button
            appearance="primary"
            onClick={() => handleBanUser()}
            isLoading={banUserMutation.isPending}
            disabled={banUserMutation.isPending}
          >
            Apply ban
          </Button>
          <Button
            appearance="secondary"
            outline
            onClick={() => handleBanUser(0)}
            isLoading={banUserMutation.isPending}
            disabled={banUserMutation.isPending}
          >
            Lift ban
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          appearance="danger"
          onClick={handleDeleteAllPosts}
          isLoading={deleteUserPostsMutation.isPending}
          disabled={deleteUserPostsMutation.isPending}
        >
          Delete all posts by user
        </Button>
        <div className="text-[11px] text-[--text-muted]">
          Removes every chat message from the user across all channels.
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          appearance="danger"
          onClick={handleDeleteAllDmPosts}
          isLoading={deleteUserDmPostsMutation.isPending}
          disabled={deleteUserDmPostsMutation.isPending}
        >
          Delete all DM posts by user
        </Button>
        <div className="text-[11px] text-[--text-muted]">
          Removes all direct messages from the user across all DM conversations. For users with many DMs, this may time out - just click again to continue deleting in chunks.
        </div>
      </div>

      <div className="border-t border-[--border-color] my-3" />

      <div className="flex flex-wrap items-center gap-3">
        <Button
          appearance="danger"
          outline
          onClick={handleDeleteUserAccount}
          isLoading={deleteUserAccountMutation.isPending}
          disabled={deleteUserAccountMutation.isPending}
        >
          🔴 Delete Account Permanently
        </Button>
        <div className="text-[11px] text-[--text-muted]">
          Permanently removes the user account. IRREVERSIBLE.
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          appearance="danger"
          onClick={handleNukeUser}
          isLoading={nukeUserMutation.isPending}
          disabled={nukeUserMutation.isPending}
        >
          💣 Nuclear Option: Delete Everything
        </Button>
        <div className="text-[11px] text-red-600 font-semibold">
          Deletes ALL posts (public + DMs) AND permanently removes account. Use only for severe violations.
        </div>
      </div>
    </div>
  );
}
