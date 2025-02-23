import { EcencyQueriesManager, QueryIdentifiers } from "@/core/react-query";
import { ExternalWalletCurrency } from "@/enums";

interface MempoolResponse {
  chain_stats: {
    funded_txo_sum: number; // in satoshi
    spent_txo_sum: number; // in satoshi
  };
}

interface EthLlamaRpcResponse {
  result: number | string; // in wei
}

interface SolResponse {
  result: {
    value: number; // in lamports
  };
}

interface TronGridResponse {
  data: {
    balance: number; // in santrons
  }[];
}

interface TonApiResponse {
  balance: number; // in nanotons
}

interface AptosLabsResponse {
  type: string; // "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>"
  data: {
    coin: {
      value: string; // Баланс в микроAPT (нужно делить на 1e8)
    };
  };
}

interface AtomResponse {
  result: {
    value: {
      coins: {
        amount: number | string; // in microATOMs
      }[];
    };
  };
}

/**
 * Returns information about the actual balance of the given currency address
 *         using various of public APIs
 * @param currency
 * @param address
 * @returns
 */
export function useExternalWalletBalanceQuery(currency: ExternalWalletCurrency, address: string) {
  return EcencyQueriesManager.generateClientServerQuery({
    queryKey: [QueryIdentifiers.EXTERNAL_WALLET_BALANCE, currency, address],
    queryFn: async () => {
      switch (currency) {
        case ExternalWalletCurrency.BTC:
          const btcResponse = await fetch(`https://mempool.space/api/address/${address}`);
          const btcResponseData = (await btcResponse.json()) as MempoolResponse;
          return (
            (btcResponseData.chain_stats.funded_txo_sum -
              btcResponseData.chain_stats.spent_txo_sum) /
            1e8
          );

        case ExternalWalletCurrency.ETH:
          const ethResponse = await fetch("https://eth.llamarpc.com", {
            method: "POST",
            body: JSON.stringify({
              jsonrpc: "2.0",
              id: "1",
              method: "eth_getBalance",
              params: [address, "latest"]
            })
          });
          const ethResponseData = (await ethResponse.json()) as EthLlamaRpcResponse;
          return +ethResponseData.result / 1e18;

        case ExternalWalletCurrency.SOL:
          const solResponse = await fetch("https://api.mainnet-beta.solana.com", {
            method: "POST",
            body: JSON.stringify({
              jsonrpc: "2.0",
              id: "1",
              method: "getBalance",
              params: [address]
            })
          });
          const solResponseData = (await solResponse.json()) as SolResponse;
          return solResponseData.result.value / 1e9;

        case ExternalWalletCurrency.TRON:
          const tronResponse = await fetch(`https://api.trongrid.io/v1/accounts/${address}`);
          const tronResponseData = (await tronResponse.json()) as TronGridResponse;
          return tronResponseData.data[0].balance / 1e6;

        case ExternalWalletCurrency.TON:
          const tonResponse = await fetch(
            `https://tonapi.io/v1/blockchain/getAccount?account=${address}`
          );
          const tonResponseData = (await tonResponse.json()) as TonApiResponse;
          return tonResponseData.balance / 1e9;

        case ExternalWalletCurrency.APT:
          const aptResponse = await fetch(
            `https://fullnode.mainnet.aptoslabs.com/v1/accounts/${address}/resources`
          );
          const aptResponseData = (await aptResponse.json()) as AptosLabsResponse[];
          const coinStore = aptResponseData.find((resource) =>
            resource.type.includes("coin::CoinStore")
          );
          if (!coinStore) return 0;

          return parseInt(coinStore.data.coin.value) / 1e8;

        case ExternalWalletCurrency.ATOM:
          const atomResponse = await fetch(
            `https://rest.cosmos.directory/cosmoshub/auth/accounts/${address}`
          );
          const atomResponseData = (await atomResponse.json()) as AtomResponse;
          return +atomResponseData.result.value.coins[0].amount / 1e6;
      }
    }
  });
}
