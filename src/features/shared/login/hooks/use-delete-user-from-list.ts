import { useGlobalStore } from "@/core/global-store";
import { User } from "@/entities";
import { useCallback } from "react";

export function useDeleteUserFromList(user: User) {
  const activeUser = useGlobalStore((state) => state.activeUser);
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
