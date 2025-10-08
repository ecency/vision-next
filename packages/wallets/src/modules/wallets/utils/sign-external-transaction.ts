import { CONFIG } from "@ecency/sdk";
import { EcencyWalletCurrency } from "@/modules/wallets/enums";
import { getWallet } from "./get-wallet";
import type { SignTxParams } from "@okxweb3/coin-base";

/**
 * Sign a transaction for an external chain supported by okxweb3 wallets.
 *
 * @param currency Chain identifier.
 * @param params   Signing parameters accepted by okxweb3 wallets.
 */
export async function signExternalTx(
  currency: EcencyWalletCurrency,
  params: SignTxParams
) {
  const wallet = getWallet(currency);
  if (!wallet) throw new Error("Unsupported currency");
  return wallet.signTransaction(params as any);
}

/**
 * Sign and broadcast a transaction for an external chain. The transaction is
 * signed locally and then sent to a public RPC endpoint for broadcasting.
 *
 * @param currency Chain identifier.
 * @param params   Signing parameters accepted by okxweb3 wallets.
 * @returns        RPC response or broadcasted transaction hash.
 */
export async function signExternalTxAndBroadcast(
  currency: EcencyWalletCurrency,
  params: SignTxParams
) {
  const signed = await signExternalTx(currency, params);

  switch (currency) {
    case EcencyWalletCurrency.BTC: {
      const res = await fetch("https://mempool.space/api/tx", {
        method: "POST",
        body: signed as any,
      });
      if (!res.ok) throw new Error("Broadcast failed");
      return res.text();
    }
    case EcencyWalletCurrency.ETH:
    case EcencyWalletCurrency.BNB: {
      const rpcUrl =
        currency === EcencyWalletCurrency.ETH
          ? "https://rpc.ankr.com/eth"
          : "https://bsc-dataseed.binance.org";
      const res = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "eth_sendRawTransaction",
          params: [signed],
        }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return json.result;
    }
    case EcencyWalletCurrency.SOL: {
      const res = await fetch(
        `https://rpc.helius.xyz/?api-key=${CONFIG.heliusApiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "sendTransaction",
            params: [signed],
          }),
        }
      );
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return json.result;
    }
    case EcencyWalletCurrency.TRON: {
      const res = await fetch(
        "https://api.trongrid.io/wallet/broadcasttransaction",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: typeof signed === "string" ? signed : JSON.stringify(signed),
        }
      );
      const json = await res.json();
      if (json.result === false) throw new Error(json.message);
      return json.txid || json.result;
    }
    case EcencyWalletCurrency.TON: {
      const res = await fetch("https://toncenter.com/api/v2/sendTransaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boc: signed }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error.message || json.result);
      return json.result;
    }
    case EcencyWalletCurrency.APT: {
      const res = await fetch(
        "https://fullnode.mainnet.aptoslabs.com/v1/transactions",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: typeof signed === "string" ? signed : JSON.stringify(signed),
        }
      );
      if (!res.ok) throw new Error("Broadcast failed");
      return res.json();
    }
    default:
      throw new Error("Unsupported currency");
  }
}

