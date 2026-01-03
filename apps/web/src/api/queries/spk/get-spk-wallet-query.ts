import { EcencyQueriesManager } from "@/core/react-query";
import { getSpkWalletQueryOptions } from "@ecency/wallets";

export function getSpkWalletQuery(username?: string) {
  return EcencyQueriesManager.generateClientServerQuery(
    getSpkWalletQueryOptions(username)
  );
}
