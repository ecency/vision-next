import { PrivateKey } from "@hiveio/dhive";
import { CONFIG, Keychain } from "@ecency/sdk";
import hs from "hivesigner";

type PointsSignType = "key" | "keychain" | "hivesigner";

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
}: PointsTransferPayload<T>) {
  const op = [
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
  ] as const;

  if (type === "key" && "key" in payload) {
    const { key } = payload as PointsTransferPayload<"key">;
    // Use hive client to broadcast custom_json with active auth
    return CONFIG.hiveClient.broadcast.sendOperations([op], key);
  }

  if (type === "keychain") {
    // Broadcast via Hive Keychain as custom_json with Active authority
    return Keychain.broadcast(from, [op], "Active") as Promise<unknown>;
  }

  // Default to hivesigner
  return hs.sendOperation(
    op,
    { callback: `https://ecency.com/@${from}/wallet` },
    () => {}
  );
}
