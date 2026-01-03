import { Symbol } from "./parse-asset";
import { AppWindow, AuthorityTypes, Keys, TxResponse } from "@/types";

declare var window: AppWindow;

export const handshake = (): Promise<void> =>
  new Promise<void>((resolve, reject) => {
    const keychain = window.hive_keychain;
    if (!keychain) {
      reject(new Error("Hive Keychain extension is unavailable or disabled."));
      return;
    }
    keychain.requestHandshake(() => {
      resolve();
    });
  });

export const signBuffer = (
  account: string,
  message: string,
  authType: AuthorityTypes = "Active",
  rpc: string | null = null
): Promise<TxResponse> =>
  new Promise<TxResponse>((resolve, reject) => {
    const keychain = window.hive_keychain;
    if (!keychain) {
      reject(new Error("Hive Keychain extension is unavailable or disabled."));
      return;
    }
    keychain.requestSignBuffer(
      account,
      message,
      authType,
      (resp) => {
        if (!resp.success) {
          reject(new Error("Operation cancelled"));
          return;
        }

        resolve(resp);
      },
      rpc
    );
  });

export const addAccountAuthority = (
  account: string,
  authorizedUsername: string,
  role: AuthorityTypes = "Posting",
  weight: number,
  rpc: string | null = null
): Promise<TxResponse> =>
  new Promise<TxResponse>((resolve, reject) => {
    const keychain = window.hive_keychain;
    if (!keychain) {
      reject(new Error("Hive Keychain extension is unavailable or disabled."));
      return;
    }
    keychain.requestAddAccountAuthority(
      account,
      authorizedUsername,
      role,
      weight,
      (resp) => {
        if (!resp.success) {
          reject(new Error("Operation cancelled"));
          return;
        }

        resolve(resp);
      },
      rpc
    );
  });

export const removeAccountAuthority = (
  account: string,
  authorizedUsername: string,
  role: AuthorityTypes,
  rpc: string | null = null
): Promise<TxResponse> =>
  new Promise<TxResponse>((resolve, reject) => {
    const keychain = window.hive_keychain;
    if (!keychain) {
      reject(new Error("Hive Keychain extension is unavailable or disabled."));
      return;
    }
    keychain.requestRemoveAccountAuthority(
      account,
      authorizedUsername,
      "Posting",
      (resp) => {
        if (!resp.success) {
          reject(new Error("Operation cancelled"));
          return;
        }

        resolve(resp);
      },
      rpc
    );
  });

export const transfer = (
  account: string,
  to: string,
  amount: string,
  memo: string,
  currency: Symbol,
  enforce: boolean,
  rpc: string | null = null
): Promise<TxResponse> =>
  new Promise<TxResponse>((resolve, reject) => {
    const keychain = window.hive_keychain;
    if (!keychain) {
      reject(new Error("Hive Keychain extension is unavailable or disabled."));
      return;
    }
    keychain.requestTransfer(
      account,
      to,
      amount,
      memo,
      currency,
      (resp) => {
        if (!resp.success) {
          reject(new Error("Operation cancelled"));
          return;
        }

        resolve(resp);
      },
      enforce,
      rpc
    );
  });

export const customJson = (
  account: string,
  id: string,
  key: AuthorityTypes,
  json: string,
  display_msg: string,
  rpc: string | null = null
): Promise<TxResponse> =>
  new Promise<TxResponse>((resolve, reject) => {
    const keychain = window.hive_keychain;
    if (!keychain) {
      reject(new Error("Hive Keychain extension is unavailable or disabled."));
      return;
    }
    keychain.requestCustomJson(
      account,
      id,
      key,
      json,
      display_msg,
      (resp) => {
        if (!resp.success) {
          reject(new Error("Operation cancelled"));
          return;
        }
        resolve(resp);
      },
      rpc
    );
  });

export const broadcast = (
  account: string,
  operations: any[],
  key: AuthorityTypes,
  rpc: string | null = null
): Promise<TxResponse> =>
  new Promise<TxResponse>((resolve, reject) => {
    const keychain = window.hive_keychain;

    if (!keychain) {
      reject(new Error("Hive Keychain extension is unavailable or disabled."));
      return;
    }

    let finished = false;
    const timeout = setTimeout(() => {
      if (!finished) {
        reject(new Error("Hive Keychain response timeout"));
      }
    }, 10000);

    keychain.requestBroadcast(
      account,
      operations,
      key,
      (resp) => {
        finished = true;
        clearTimeout(timeout);
        if (!resp.success) {
          reject(new Error("Operation cancelled"));
          return;
        }

        resolve(resp);
      },
      rpc
    );
  });

export const addAccount = (username: string, keys: Keys): Promise<TxResponse> =>
  new Promise<TxResponse>((resolve, reject) => {
    const keychain = window.hive_keychain;
    if (!keychain) {
      reject(new Error("Hive Keychain extension is unavailable or disabled."));
      return;
    }
    keychain.requestAddAccount(username, keys, (resp) => {
      if (!resp.success) {
        reject(new Error("Operation cancelled"));
        return;
      }

      resolve(resp);
    });
  });

export const witnessVote = (
  account: string,
  witness: string,
  vote: boolean,
  rpc: string | null = null
): Promise<TxResponse> =>
  new Promise<TxResponse>((resolve, reject) => {
    const keychain = window.hive_keychain;
    if (!keychain) {
      reject(new Error("Hive Keychain extension is unavailable or disabled."));
      return;
    }
    keychain.requestWitnessVote(
      account,
      witness,
      vote,
      (resp) => {
        if (!resp.success) {
          reject(new Error("Operation cancelled"));
          return;
        }

        resolve(resp);
      },
      rpc
    );
  });

export const witnessProxy = (
  account: string,
  proxy: string,
  rpc: string | null = null
): Promise<TxResponse> =>
  new Promise<TxResponse>((resolve, reject) => {
    const keychain = window.hive_keychain;
    if (!keychain) {
      reject(new Error("Hive Keychain extension is unavailable or disabled."));
      return;
    }
    keychain.requestProxy(
      account,
      proxy,
      (resp) => {
        if (!resp.success) {
          reject(new Error("Operation cancelled"));
          return;
        }

        resolve(resp);
      },
      rpc
    );
  });

export function isKeychainInAppBrowser(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as AppWindow;

  if (typeof w.hive_keychain === "object") {
    return true;
  }

  if (typeof w.__KEYCHAIN_WEBVIEW__ === "object") {
    return true;
  }

  return typeof w.ReactNativeWebView?.postMessage === "function";
}

