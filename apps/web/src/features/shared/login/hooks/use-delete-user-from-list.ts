import { useActiveAccount } from "@/core/hooks/use-active-account";
import { User } from "@/entities";
import { useCallback } from "react";
import { useGlobalStore } from "@/core/global-store";

export function useDeleteUserFromList(user: User) {
  const { activeUser } = useActiveAccount();
  const setActiveUser = useGlobalStore((state) => state.setActiveUser);
  const deleteUser = useGlobalStore((state) => state.deleteUser);

  return useCallback(() => {
    deleteUser(user.username);

    // logout if active user
    if (activeUser && user.username === activeUser.username) {
      setActiveUser(null);
    }
  }, [user, activeUser]);
}
