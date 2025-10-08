import { KeyChainImpl } from "./keychain-impl";

export interface AppWindow extends Window {
  usePrivate: boolean;
  nws?: WebSocket;
  comTag?: {};
  hive_keychain?: KeyChainImpl;
  __KEYCHAIN_WEBVIEW__: any;
  ReactNativeWebView: any;
  twttr: {
    widgets?: {
      load: () => void;
    };
  };
}
