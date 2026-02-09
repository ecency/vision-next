import { useCallback, useState } from "react";
import {
  useMattermostAdminBanUser,
  useMattermostAdminDeleteUserPosts,
  useMattermostAdminDeleteUserDmPosts,
  useMattermostAdminDeleteUserAccount,
  useMattermostAdminNukeUser,
  useMattermostUserSearch
} from "../mattermost-api";

export function useChannelAdmin(isEcencyAdmin: boolean) {
  const [adminUsername, setAdminUsername] = useState("");
  const [banHours, setBanHours] = useState("24");
  const [adminMessage, setAdminMessage] = useState<string | null>(null);
  const [adminError, setAdminError] = useState<string | null>(null);

  const banUserMutation = useMattermostAdminBanUser();
  const deleteUserPostsMutation = useMattermostAdminDeleteUserPosts();
  const deleteUserDmPostsMutation = useMattermostAdminDeleteUserDmPosts();
  const deleteUserAccountMutation = useMattermostAdminDeleteUserAccount();
  const nukeUserMutation = useMattermostAdminNukeUser();
  const adminUserSearch = useMattermostUserSearch(
    adminUsername,
    Boolean(isEcencyAdmin && adminUsername.trim().length >= 2)
  );

  const handleBanUser = useCallback(
    (hoursOverride?: number | null) => {
      if (!isEcencyAdmin) return;

      const normalizedUsername = adminUsername.trim().replace(/^@/, "");
      const hoursValue = hoursOverride ?? Number(banHours);

      if (!normalizedUsername) {
        setAdminError("Enter a username to manage");
        setAdminMessage(null);
        return;
      }

      if (Number.isNaN(hoursValue) || hoursValue < 0) {
        setAdminError("Ban hours must be zero or a positive number");
        setAdminMessage(null);
        return;
      }

      setAdminError(null);
      setAdminMessage(null);

      banUserMutation.mutate(
        { username: normalizedUsername, hours: hoursValue },
        {
          onSuccess: ({ bannedUntil }) => {
            if (hoursValue === 0 || bannedUntil === null) {
              setAdminMessage(`Lifted chat ban for @${normalizedUsername}`);
            } else {
              setAdminMessage(
                `@${normalizedUsername} banned until ${new Date(Number(bannedUntil)).toLocaleString()}`
              );
            }
          },
          onError: (err) => {
            setAdminError((err as Error)?.message || "Unable to update ban");
          }
        }
      );
    },
    [isEcencyAdmin, adminUsername, banHours, banUserMutation]
  );

  const handleDeleteAllPosts = useCallback(() => {
    if (!isEcencyAdmin) return;

    const normalizedUsername = adminUsername.trim().replace(/^@/, "");
    if (!normalizedUsername) {
      setAdminError("Enter a username to manage");
      setAdminMessage(null);
      return;
    }

    if (
      typeof window !== "undefined" &&
      !window.confirm(`Delete all posts by @${normalizedUsername} across all chat channels?`)
    ) {
      return;
    }

    setAdminError(null);
    setAdminMessage(null);

    deleteUserPostsMutation.mutate(normalizedUsername, {
      onSuccess: ({ deleted }) => {
        setAdminMessage(`Deleted ${deleted} post${deleted === 1 ? "" : "s"} from @${normalizedUsername}`);
      },
      onError: (err) => {
        const errorMessage = (err as Error)?.message || "Unable to delete posts";
        setAdminError(`Error: ${errorMessage}. Note: This feature may require Mattermost Enterprise Edition.`);
        console.error("Delete posts error:", err);
      }
    });
  }, [isEcencyAdmin, adminUsername, deleteUserPostsMutation]);

  const handleDeleteAllDmPosts = useCallback(() => {
    if (!isEcencyAdmin) return;

    const normalizedUsername = adminUsername.trim().replace(/^@/, "");
    if (!normalizedUsername) {
      setAdminError("Enter a username to manage");
      setAdminMessage(null);
      return;
    }

    if (
      typeof window !== "undefined" &&
      !window.confirm(`Delete all DM posts by @${normalizedUsername}? This will remove all their direct messages across all DM conversations.`)
    ) {
      return;
    }

    setAdminError(null);
    setAdminMessage(null);

    deleteUserDmPostsMutation.mutate(normalizedUsername, {
      onSuccess: ({ deleted, timedOut }) => {
        if (timedOut) {
          setAdminMessage(
            `⏱️ Deleted ${deleted} DM post${deleted === 1 ? "" : "s"} from @${normalizedUsername}.\n` +
            `Operation timed out - there may be more posts. Click the button again to continue deleting.`
          );
        } else {
          setAdminMessage(`✓ Deleted ${deleted} DM post${deleted === 1 ? "" : "s"} from @${normalizedUsername}`);
        }
      },
      onError: (err) => {
        setAdminError((err as Error)?.message || "Unable to delete DM posts");
      }
    });
  }, [isEcencyAdmin, adminUsername, deleteUserDmPostsMutation]);

  const handleDeleteUserAccount = useCallback(() => {
    if (!isEcencyAdmin) return;

    const normalizedUsername = adminUsername.trim().replace(/^@/, "");
    if (!normalizedUsername) {
      setAdminError("Enter a username to manage");
      setAdminMessage(null);
      return;
    }

    if (
      typeof window !== "undefined" &&
      !window.confirm(
        `⚠️ PERMANENTLY DELETE account @${normalizedUsername}?\n\n` +
        `This will:\n` +
        `• Delete the user profile\n` +
        `• Remove all memberships\n` +
        `• Delete all posts (handled by Mattermost)\n` +
        `• Delete uploaded files\n\n` +
        `THIS CANNOT BE UNDONE!`
      )
    ) {
      return;
    }

    setAdminError(null);
    setAdminMessage(null);

    deleteUserAccountMutation.mutate(normalizedUsername, {
      onSuccess: ({ deleted, deactivated, username }) => {
        if (deleted) {
          setAdminMessage(`✓ Account @${username} permanently deleted (Enterprise Edition)`);
        } else if (deactivated) {
          setAdminMessage(
            `⚠️ Account @${username} deactivated (Team Edition fallback).\n` +
            `Permanent deletion requires Enterprise Edition. User is now inactive and cannot log in.`
          );
        } else {
          setAdminMessage(`✓ Account @${username} removed`);
        }
        setAdminUsername("");
      },
      onError: (err) => {
        const errorMessage = (err as Error)?.message || "Unable to delete account";
        setAdminError(
          `Error: ${errorMessage}\n\n` +
          `Common causes:\n` +
          `• @ecency user needs System Admin role in Mattermost\n` +
          `• MATTERMOST_ADMIN_TOKEN not configured\n` +
          `• Check browser console for details`
        );
        console.error("Delete account error:", err);
      }
    });
  }, [isEcencyAdmin, adminUsername, deleteUserAccountMutation]);

  const handleNukeUser = useCallback(() => {
    if (!isEcencyAdmin) return;

    const normalizedUsername = adminUsername.trim().replace(/^@/, "");
    if (!normalizedUsername) {
      setAdminError("Enter a username to manage");
      setAdminMessage(null);
      return;
    }

    if (
      typeof window !== "undefined" &&
      !window.confirm(
        `💣 NUCLEAR OPTION: Completely remove @${normalizedUsername}?\n\n` +
        `This will:\n` +
        `1. Delete ALL public/community posts\n` +
        `2. Delete ALL DM and group messages\n` +
        `3. PERMANENTLY delete the account\n\n` +
        `⚠️ THIS IS IRREVERSIBLE AND CANNOT BE UNDONE!\n\n` +
        `Only use this for severe violations (spam bots, abuse, etc.)`
      )
    ) {
      return;
    }

    setAdminError(null);
    setAdminMessage("🔄 Nuking user... (this may take a while)");

    nukeUserMutation.mutate(normalizedUsername, {
      onSuccess: ({ username, deletedPublicPosts, deletedDmPosts, accountDeleted }) => {
        setAdminMessage(
          `✓ User @${username} completely removed:\n` +
          `• ${deletedPublicPosts} public posts deleted\n` +
          `• ${deletedDmPosts} DM/group posts deleted\n` +
          `• Account ${accountDeleted ? "deleted" : "deletion failed (may require Enterprise Edition)"}`
        );
        setAdminUsername("");
      },
      onError: (err) => {
        const errorMessage = (err as Error)?.message || "Unable to nuke user";
        setAdminError(
          `Error: ${errorMessage}. ` +
          `This operation may require Mattermost Enterprise Edition.`
        );
        console.error("Nuke user error:", err);
      }
    });
  }, [isEcencyAdmin, adminUsername, nukeUserMutation]);

  return {
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
  };
}
