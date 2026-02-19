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
          .map((x) => {
            const u = decodeObj(x) as User;
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
          })
          .sort((a, b) => (a.index ?? 0) - (b?.index ?? 0))
      }),
    addUser: (user: User) => {
      const existingUser = getState().users.find((x) => x.username === user.username);
      const existingIndex = existingUser?.index;

      set({
        users: [
          ...getState().users.filter((x) => x.username !== user.username),
          {
            ...user,
            // Preserve existing index when updating a user, otherwise add to end
            index: existingIndex !== undefined ? existingIndex : getState().users.length
          }
        ].sort((a, b) => (a.index ?? 0) - (b?.index ?? 0))
      });

      ls.set(`user_${user.username}`, encodeObj(user));
    },
    deleteUser: (username: string) => {
      ls.remove(`user_${username}`);
      set({
        users: getState().users.filter((x) => x.username !== username)
      });
    }
  };
}
