import { User } from "@/entities";
import * as ls from "@/utils/local-storage";
import { decodeObj, encodeObj } from "@/utils";

export function createUsersState() {
  return {
    users: [] as User[]
  };
}

type State = ReturnType<typeof createUsersState>;

export function createUsersActions(set: (state: Partial<State>) => void, getState: () => State) {
  return {
    loadUsers: () =>
      set({
        users: ls.getByPrefix("user_").map((x) => {
          const u = decodeObj(x) as User;
          return {
            username: u.username,
            refreshToken: "",
            accessToken: "",
            expiresIn: u.expiresIn,
            postingKey: u.postingKey
          };
        })
      }),
    addUser: (user: User) => {
      set({
        users: [...getState().users.filter((x) => x.username !== user.username), user]
      });

      ls.set(`user_${user.username}`, encodeObj(user));
      ls.getByPrefix("user_").map((x) => {
        const u = decodeObj(x) as User;
        return {
          username: u.username,
          refreshToken: "",
          accessToken: "",
          expiresIn: u.expiresIn,
          postingKey: u.postingKey
        };
      });
    },
    deleteUser: (username: string) => {
      ls.remove(`user_${username}`);
      set({
        users: getState().users.filter((x) => x.username !== username)
      });
    }
  };
}
