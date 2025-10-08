import { buildPsbt as buildBtcPsbt } from "@okxweb3/coin-bitcoin";
import type { utxoTx } from "@okxweb3/coin-bitcoin/dist/type";
import type { Network as BtcNetwork } from "@okxweb3/coin-bitcoin/dist/bitcoinjs-lib";
import type { EthTxParams } from "@okxweb3/coin-ethereum/dist/EthWallet";
import type { SolSignParam } from "@okxweb3/coin-solana/dist/SolWallet";
import type { TrxSignParam } from "@okxweb3/coin-tron/dist/TrxWallet";
import type { TxData as TonTxData } from "@okxweb3/coin-ton/dist/api/types";
import type { AptosParam } from "@okxweb3/coin-aptos/dist/AptosWallet";
import { EcencyWalletCurrency } from "@/modules/wallets/enums";

/**
 * Union type covering all chain-specific build parameters.
 */
export type ExternalTxParams =
  | utxoTx
  | EthTxParams
  | SolSignParam
  | TrxSignParam
  | TonTxData
  | AptosParam;

/**
 * Build a Bitcoin PSBT from UTXO inputs and desired outputs.
 *
 * @param tx Transaction description accepted by @okxweb3/coin-bitcoin.
 * @returns Hex encoded PSBT ready for signing.
 */
export function buildPsbt(
  tx: utxoTx,
  network?: BtcNetwork,
  maximumFeeRate?: number
) {
  return buildBtcPsbt(tx, network, maximumFeeRate);
}

/**
 * Helper returning raw Ethereum transaction data ready for signing.
 *
 * The returned object can be passed directly to signExternalTx.
 */
export function buildEthTx(data: EthTxParams): EthTxParams {
  return data;
}

/**
 * Helper returning Solana transaction params used by signExternalTx.
 */
export function buildSolTx(data: SolSignParam): SolSignParam {
  return data;
}

/**
 * Helper returning Tron transaction params used by signExternalTx.
 */
export function buildTronTx(data: TrxSignParam): TrxSignParam {
  return data;
}

/**
 * Helper returning TON transaction params used by signExternalTx.
 */
export function buildTonTx(data: TonTxData): TonTxData {
  return data;
}

/**
 * Helper returning Aptos transaction params used by signExternalTx.
 */
export function buildAptTx(data: AptosParam): AptosParam {
  return data;
}

/**
 * Build a transaction for an external chain supported by okxweb3 wallets.
 *
 * @param currency Chain identifier.
 * @param tx       Chain specific transaction description.
 */
export function buildExternalTx(
  currency: EcencyWalletCurrency,
  tx: ExternalTxParams
) {
  switch (currency) {
    case EcencyWalletCurrency.BTC:
      return buildPsbt(tx as utxoTx);
    case EcencyWalletCurrency.ETH:
    case EcencyWalletCurrency.BNB:
      return buildEthTx(tx as EthTxParams);
    case EcencyWalletCurrency.SOL:
      return buildSolTx(tx as SolSignParam);
    case EcencyWalletCurrency.TRON:
      return buildTronTx(tx as TrxSignParam);
    case EcencyWalletCurrency.TON:
      return buildTonTx(tx as TonTxData);
    case EcencyWalletCurrency.APT:
      return buildAptTx(tx as AptosParam);
    default:
      throw new Error("Unsupported currency");
  }
}
