import { KeyChainImpl } from "./keychain-impl";

export interface PeakVaultApi {
  requestBroadcast: (
    account: string,
    operations: any[],
    keyRole: "posting" | "active" | "memo",
    displayMessage?: string | { title: string; message: string }
  ) => Promise<{ success: boolean; error: string; account: string; publicKey?: string; result: any }>;
  requestSignBuffer: (
    account: string,
    keyRole: "posting" | "active" | "memo",
    message: string,
    displayMessage?: string | { title: string; message: string }
  ) => Promise<{ success: boolean; error: string; account: string; publicKey?: string; result: any }>;
  connect: (
    account: string,
    keyRole?: "posting" | "active" | "memo"
  ) => Promise<{ success: boolean; error: string; account: string; publicKey?: string; result: any }>;
}

/** A Hive Unified Wallet Protocol provider registry entry (window.hive.providers[]). */
export interface HiveWalletProviderEntry {
  name: string;
  rdns: string;
  provider: KeyChainImpl;
}

/**
 * A Keychain-compatible wallet global, plus the optional Hive Unified Wallet
 * Protocol identity flags and provider registry that Keeper sets on window.hive.
 */
export type HiveWalletApi = KeyChainImpl & {
  isKeeper?: boolean;
  isKeychain?: boolean;
  isVault?: boolean;
  providers?: HiveWalletProviderEntry[];
};

export interface AppWindow extends Window {
  usePrivate: boolean;
  nws?: WebSocket;
  comTag?: {};
  hive_keychain?: HiveWalletApi;
  /**
   * Hive Keeper extension (Ecency) - same API as Keychain. Keeper owns this
   * global, sets `isKeeper`, and registers the unified-protocol `providers`
   * registry on it.
   */
  hive?: HiveWalletApi;
  /**
   * Set by Keeper's content script in its own isolated world only. It is NOT
   * visible to page scripts, so do not gate Keeper detection/resolution on it -
   * use `window.hive.isKeeper` instead.
   */
  hive_extension?: boolean;
  /** Peak Vault extension (PeakD) - promise-based API */
  peakvault?: PeakVaultApi;
  __KEYCHAIN_WEBVIEW__: any;
  ReactNativeWebView: any;
  twttr: {
    widgets?: {
      load: () => void;
    };
  };
}
