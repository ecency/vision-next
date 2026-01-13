import { PrivateKey, type Operation } from "@hiveio/dhive";
import { CONFIG } from "@ecency/sdk";
import type { AuthContext } from "@ecency/sdk";
import hs from "hivesigner";
import { broadcastWithWalletHiveAuth } from "../../utils/hive-auth";

type PointsSignType = "key" | "keychain" | "hivesigner" | "hiveauth";

interface PointsTransferPayloadBase {
  from: string;
  to: string;
  amount: string;
  memo: string;
  type: PointsSignType;
}

type PointsTransferPayload<T extends PointsSignType> = T extends "key"
  ? PointsTransferPayloadBase & { key: PrivateKey }
  : PointsTransferPayloadBase;

export async function transferPoint<T extends PointsSignType>({
  from,
  to,
  amount,
  memo,
  type,
  ...payload
}: PointsTransferPayload<T>, auth?: AuthContext) {
  const op: Operation = [
    "custom_json",
    {
      id: "ecency_point_transfer",
      json: JSON.stringify({
        sender: from,
        receiver: to,
        amount: amount.replace("POINTS", "POINT"),
        memo,
      }),
      required_auths: [from],
      required_posting_auths: [],
    },
  ];

  if (type === "key" && "key" in payload) {
    const { key } = payload as PointsTransferPayload<"key">;
    // Use hive client to broadcast custom_json with active auth
    return CONFIG.hiveClient.broadcast.sendOperations([op], key);
  }

  if (type === "keychain") {
    if (auth?.broadcast) {
      return auth.broadcast([op], "active");
    }
    throw new Error("[SDK][Wallets] – missing broadcaster");
  }

  if (type === "hiveauth") {
    if (auth?.broadcast) {
      return auth.broadcast([op], "active");
    }
    return broadcastWithWalletHiveAuth(from, [op], "active");
  }

  // Default to hivesigner
  return hs.sendOperation(op, { callback: `https://ecency.com/@${from}/wallet` }, () => {});
}
