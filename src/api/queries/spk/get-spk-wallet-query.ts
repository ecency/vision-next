import { EcencyQueriesManager, QueryIdentifiers } from "@/core/react-query";
import { getHivePrice, getMarkets, getSpkWallet, rewardSpk } from "@/api/spk-api";
import { SpkApiWallet } from "@/entities";

export const getEstimatedBalance = async (wallet: SpkApiWallet) => {
  const hivePrice = await getHivePrice();
  return (
    ((wallet.gov + wallet.poweredUp + wallet.claim + wallet.spk + wallet.balance) / 1000) *
    +wallet.tick *
    hivePrice.hive.usd
  ).toFixed(2);
};

export const getSpkWalletQuery = (username?: string) =>
  EcencyQueriesManager.generateClientServerQuery({
    queryKey: [QueryIdentifiers.SPK_USER_WALLET, username],
    queryFn: async () => {
      if (!username) {
        throw new Error("[SPK][getUserWallet] username isn`t provided");
      }
      const wallet = await getSpkWallet(username);
      const { raw, list } = await getMarkets();

      const format = (value: number) => value.toFixed(3);

      return {
        tokenBalance: format(
          (wallet.spk +
            rewardSpk(
              wallet,
              raw.stats || {
                spk_rate_lgov: "0.001",
                spk_rate_lpow: format(parseFloat(raw.stats.spk_rate_lpow) * 100),
                spk_rate_ldel: format(parseFloat(raw.stats.spk_rate_ldel) * 100)
              }
            )) /
            1000
        ),
        larynxAirBalance: format(wallet.drop.availible.amount / 1000),
        larynxTokenBalance: format(wallet.balance / 1000),
        larynxPowerBalance: format(wallet.poweredUp / 1000),
        larynxGrantedBalance: wallet.granted?.t ? format(wallet.granted.t / 1000) : "",
        larynxGrantingBalance: wallet.granting?.t ? format(wallet.granting.t / 1000) : "",
        larynxLockedBalance: wallet.gov > 0 ? format(wallet.gov / 1000) : "",
        claim: format(wallet.claim / 1000),
        larynxPowerRate: "0.010",
        headBlock: wallet.head_block,
        powerDownList: Object.values(wallet.power_downs),
        delegatedItems: Object.entries(wallet.granted).filter(([name]) => name !== "t") as [
          string,
          number
        ][],
        delegatingItems: Object.entries(wallet.granting).filter(([name]) => name !== "t") as [
          string,
          number
        ][],
        estimatedBalance: await getEstimatedBalance(wallet),
        markets: list,
        isNode: list.some((market) => market.name === username),
        rateLPow: format(parseFloat(raw.stats.spk_rate_lpow) * 100),
        rateLDel: format(parseFloat(raw.stats.spk_rate_ldel) * 100)
      };
    },
    enabled: !!username,
    refetchOnMount: true,
    staleTime: 30000,
    initialData: {
      tokenBalance: "0.000",
      larynxAirBalance: "0.000",
      larynxTokenBalance: "0.000",
      larynxPowerBalance: "0.000",
      larynxGrantedBalance: "0.000",
      larynxGrantingBalance: "0.000",
      larynxLockedBalance: "0.000",
      claim: "0.000",
      larynxPowerRate: "0.000",
      headBlock: 0,
      powerDownList: [],
      delegatingItems: [],
      delegatedItems: [],
      estimatedBalance: "0.000",
      markets: [],
      isNode: false,
      rateLDel: "0.000",
      rateLPow: "0.000"
    }
  });
