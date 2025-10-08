import { CONFIG } from "@/modules/core/config";
import { StoringUser } from "./entities";
import { decodeObj } from "./utils";

export const getUser = (username: string): StoringUser | undefined => {
  try {
    const raw = CONFIG.storage.getItem(
      CONFIG.storagePrefix + "_user_" + username
    );
    return decodeObj(JSON.parse(raw!)) as StoringUser;
  } catch (e) {
    console.error(e);
    return undefined;
  }
};

export const getAccessToken = (username: string): string | undefined =>
  getUser(username) && getUser(username)!.accessToken;

export const getPostingKey = (username: string): null | undefined | string =>
  getUser(username) && getUser(username)!.postingKey;

export const getLoginType = (username: string): null | undefined | string =>
    getUser(username) && getUser(username)!.loginType;

export const getRefreshToken = (username: string): string | undefined =>
  getUser(username) && getUser(username)!.refreshToken;
