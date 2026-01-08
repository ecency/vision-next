import { getHivePrice } from "@ecency/sdk";
import { SpkApiWallet } from "@/entities";

export const getSplEstimatedBalance = async (wallet: SpkApiWallet) => {
  const hivePrice = await getHivePrice().catch(() => ({ hive: { usd: 0 } }));
  return (
    ((wallet.gov + wallet.poweredUp + wallet.claim + wallet.spk + wallet.balance) / 1000) *
    +wallet.tick *
    hivePrice.hive.usd
  ).toFixed(2);
};
