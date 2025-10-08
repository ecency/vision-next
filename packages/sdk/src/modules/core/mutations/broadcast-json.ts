import { CONFIG } from "@/modules/core/config";
import { PrivateKey } from "@hiveio/dhive";
import hs from "hivesigner";
import {getAccessToken, getLoginType, getPostingKey} from "../storage";
import {Keychain} from "@/modules/keychain";

export async function broadcastJson<T>(
  username: string | undefined,
  id: string,
  payload: T
) {
  if (!username) {
    throw new Error(
      "[Core][Broadcast] Attempted to call broadcast API with anon user"
    );
  }
  const jjson = {
    id,
    required_auths: [],
    required_posting_auths: [username],
    json: JSON.stringify(payload),
  };

  const postingKey = getPostingKey(username);
  if (postingKey) {
    const privateKey = PrivateKey.fromString(postingKey);

    return CONFIG.hiveClient.broadcast.json(
      jjson,
      privateKey
    );
  }

  const loginType = getLoginType(username);
  if (loginType && loginType == 'keychain') {
    return Keychain.broadcast(username, [["custom_json", jjson]], "Posting").then((r: any) => r.result)
  }

  // With hivesigner access token
  let token = getAccessToken(username);
  if (token) {
    const response = await new hs.Client({
      accessToken: token,
    }).customJson([], [username], id, JSON.stringify(payload));
    return response.result;
  }

  throw new Error(
    "[SDK][Broadcast] – cannot broadcast w/o posting key or token"
  );
}
