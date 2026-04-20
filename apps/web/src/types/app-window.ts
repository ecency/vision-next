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

export interface AppWindow extends Window {
  usePrivate: boolean;
  nws?: WebSocket;
  comTag?: {};
  hive_keychain?: KeyChainImpl;
  /** Hive Keeper extension (Ecency) - same API as Keychain */
  hive?: KeyChainImpl;
  /** Hive Keeper sets this to true when injected */
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
