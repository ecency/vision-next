import { CONFIG } from "@/modules/core/config";
import { PrivateKey } from "@hiveio/dhive";
import hs from "hivesigner";
import type { AuthContext } from "@/modules/core/types";

export async function broadcastJson<T>(
  username: string | undefined,
  id: string,
  payload: T,
  auth?: AuthContext
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

  if (auth?.broadcast) {
    return auth.broadcast([["custom_json", jjson]], auth, "Posting");
  }

  const postingKey = auth?.postingKey;
  if (postingKey) {
    const privateKey = PrivateKey.fromString(postingKey);

    return CONFIG.hiveClient.broadcast.json(
      jjson,
      privateKey
    );
  }

  // With hivesigner access token
  const accessToken = auth?.accessToken;
  if (accessToken) {
    const response = await new hs.Client({
      accessToken,
    }).customJson([], [username], id, JSON.stringify(payload));
    return response.result;
  }

  throw new Error(
    "[SDK][Broadcast] – cannot broadcast w/o posting key or token"
  );
}
