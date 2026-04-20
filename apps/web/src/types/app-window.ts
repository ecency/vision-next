import { KeyChainImpl } from "./keychain-impl";

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
  peakvault?: any;
  __KEYCHAIN_WEBVIEW__: any;
  ReactNativeWebView: any;
  twttr: {
    widgets?: {
      load: () => void;
    };
  };
}
