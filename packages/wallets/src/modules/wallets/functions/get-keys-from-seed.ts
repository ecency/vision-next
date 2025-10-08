import { EcencyWalletCurrency } from "@/modules/wallets/enums";
import { BaseWallet } from "@okxweb3/coin-base";

/**
 * These HD paths covers popular wallets like Trust, Meta, Ledger, Trezor
 * Supports also XVerse
 */
const HD_PATHS: Record<EcencyWalletCurrency, string[]> = {
  [EcencyWalletCurrency.BTC]: ["m/84'/0'/0'/0/0"],
  [EcencyWalletCurrency.ETH]: ["m/84'/60'/0'/0/0"], // its not working for Trust, Exodus, todo: check others below
  [EcencyWalletCurrency.BNB]: ["m/84'/60'/0'/0/0"],
  [EcencyWalletCurrency.SOL]: ["m/84'/501'/0'/0/0"],
  [EcencyWalletCurrency.TRON]: ["m/44'/195'/0'/0'/0'"],
  [EcencyWalletCurrency.APT]: ["m/84'/637'/0'/0/0"],
  [EcencyWalletCurrency.TON]: ["m/44'/607'/0'"],
};

export async function getKeysFromSeed(
  mnemonic: string,
  wallet: BaseWallet,
  currency: EcencyWalletCurrency
) {
  for (const hdPath of HD_PATHS[currency] || []) {
    try {
      const derivedPrivateKey = await wallet.getDerivedPrivateKey({
        mnemonic,
        hdPath,
      });

      const derivedPublicKey = await wallet.getNewAddress({
        privateKey: derivedPrivateKey,
        addressType:
          currency === EcencyWalletCurrency.BTC ? "segwit_native" : undefined,
      });

      return [derivedPrivateKey.toString(), derivedPublicKey.address] as const;
    } catch (error) {
      return [];
    }
  }
  return [];
}
