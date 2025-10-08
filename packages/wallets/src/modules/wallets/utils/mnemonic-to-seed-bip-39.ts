import { mnemonicToSeedSync } from "bip39";

export function mnemonicToSeedBip39(value: string) {
  return mnemonicToSeedSync(value).toString("hex");
}
