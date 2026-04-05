import { mnemonicToSeedSync } from "bip39";
import { HDKey } from "@scure/bip32";
import { PrivateKey } from "@ecency/hive-tx";

export type HiveRole = "owner" | "active" | "posting" | "memo";

const ROLE_INDEX: Record<HiveRole, number> = {
  owner: 0,
  active: 1,
  posting: 2,
  memo: 3,
};

export function deriveHiveKey(
  mnemonic: string,
  role: HiveRole,
  accountIndex = 0
) {
  const seed = mnemonicToSeedSync(mnemonic);
  const master = HDKey.fromMasterSeed(seed);
  const path = `m/44'/3054'/${accountIndex}'/0'/${ROLE_INDEX[role]}'`;
  const child = master.derive(path);
  if (!child.privateKey) {
    throw new Error("[Ecency][Wallets] - hive key derivation failed");
  }
  const pk = PrivateKey.from(Buffer.from(child.privateKey));
  return {
    privateKey: pk.toString(),
    publicKey: pk.createPublic().toString(),
  } as const;
}

export function deriveHiveKeys(
  mnemonic: string,
  accountIndex = 0
) {
  const owner = deriveHiveKey(mnemonic, "owner", accountIndex);
  const active = deriveHiveKey(mnemonic, "active", accountIndex);
  const posting = deriveHiveKey(mnemonic, "posting", accountIndex);
  const memo = deriveHiveKey(mnemonic, "memo", accountIndex);
  return {
    owner: owner.privateKey,
    active: active.privateKey,
    posting: posting.privateKey,
    memo: memo.privateKey,
    ownerPubkey: owner.publicKey,
    activePubkey: active.publicKey,
    postingPubkey: posting.publicKey,
    memoPubkey: memo.publicKey,
  } as const;
}

