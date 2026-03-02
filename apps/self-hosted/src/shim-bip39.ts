/**
 * ESM shim for bip39: the package has only named exports, but @ecency/wallets
 * uses both default and named imports. Re-export namespace as default and re-export names.
 */
import * as bip39 from 'bip39-original';

export default bip39;
export const generateMnemonic = bip39.generateMnemonic;
export const mnemonicToSeedSync = bip39.mnemonicToSeedSync;
export const mnemonicToSeed = bip39.mnemonicToSeed;
export const entropyToMnemonic = bip39.entropyToMnemonic;
export const mnemonicToEntropy = bip39.mnemonicToEntropy;
export const validateMnemonic = bip39.validateMnemonic;
