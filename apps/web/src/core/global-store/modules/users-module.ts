import { User } from "@/entities";
import { decodeObj, encodeObj } from "@/utils";
import * as ls from "@/utils/local-storage";
import { AuthenticationState } from "./authentication-module";

export function createUsersState() {
  return {
    users: [] as User[]
  };
}

type State = ReturnType<typeof createUsersState>;

export function createUsersActions(
  set: (state: Partial<State>) => void,
  getState: () => State & AuthenticationState
) {
  return {
    setUsers: (usersList: User[]) => {
      usersList.map((user) => ls.set(`user_${user.username}`, encodeObj(user)));
      set({
        users: usersList
      });
    },
    loadUsers: () =>
      set({
        users: ls
          .getByPrefix("user_")
          .map((x): User | null => {
            // Isolate each record: a single corrupted/truncated `user_*` entry must
            // not throw out of loadUsers() and white-screen auth init on every load.
            try {
              const u = decodeObj(x) as User | undefined;
              if (!u || !u.username) {
                return null;
              }
              return {
                username: u.username,
                refreshToken: u.refreshToken,
                accessToken: u.accessToken,
                expiresIn: u.expiresIn,
                tokenObtainedAt: u.tokenObtainedAt,
                postingKey: u.postingKey,
                loginType: u.loginType,
                index: u.index
              };
            } catch (e) {
              return null;
            }
          })
          .filter((u): u is User => u !== null)
          .sort((a, b) => (a.index ?? 0) - (b?.index ?? 0))
      }),
    addUser: (user: User) => {
      const existingUser = getState().users.find((x) => x.username === user.username);
      const existingIndex = existingUser?.index;

      // Preserve existing index when updating a user, otherwise add to end.
      const index = existingIndex !== undefined ? existingIndex : getState().users.length;
      const userWithIndex = { ...user, index };

      set({
        users: [
          ...getState().users.filter((x) => x.username !== user.username),
          userWithIndex
        ].sort((a, b) => (a.index ?? 0) - (b?.index ?? 0))
      });

      // Persist the indexed user so multi-account ordering survives a reload
      // (previously the bare `user` was stored without its computed index).
      ls.set(`user_${user.username}`, encodeObj(userWithIndex));
    },
    deleteUser: (username: string) => {
      ls.remove(`user_${username}`);
      set({
        users: getState().users.filter((x) => x.username !== username)
      });
    }
  };
}
