import { AppWindow } from "@/types";
import { CONFIG, encryptMemoWithAccounts, decryptMemoWithKeys } from "@ecency/sdk";
import { getDecodedMemo } from "@/utils/hive-signer";
import { requestMemoKey, getTempMemoKey } from "@/features/shared/memo-key";

declare var window: AppWindow;

/**
 * Encrypt a memo using the appropriate method for the user's auth type.
 *
 * - Keychain: uses Keychain's requestEncodeMessage API (no key needed from user)
 * - All others: prompts for memo key via dialog, then uses SDK's encryptMemoWithAccounts
 *
 * @param loginType The user's auth method ("keychain", "hivesigner", "key", "hiveauth")
 * @param username The sender's username
 * @param toAccount The recipient's username
 * @param memo The plaintext memo (without # prefix)
 * @returns The encrypted memo string
 */
export async function encryptMemo(
  loginType: string | null | undefined,
  username: string,
  toAccount: string,
  memo: string
): Promise<string> {
  if (loginType === "keychain") {
    return keychainEncode(username, toAccount, memo);
  }

  // For all other auth methods, prompt for memo key
  const memoKey = getTempMemoKey() || (await requestMemoKey("encrypt"));
  if (!memoKey) {
    throw new Error("Memo key not provided");
  }

  return encryptMemoWithAccounts(CONFIG.hiveClient, memoKey, toAccount, `#${memo}`);
}

/**
 * Decrypt a memo using the appropriate method for the user's auth type.
 *
 * - Keychain: uses Keychain's requestVerifyKey API
 * - HiveSigner: uses HiveSigner's getDecodedMemo API
 * - All others: prompts for memo key via dialog, then uses SDK's decryptMemoWithKeys
 *
 * @param loginType The user's auth method
 * @param username The user's username
 * @param encryptedMemo The encrypted memo string (starts with #)
 * @returns The decrypted plaintext
 */
export async function decryptMemo(
  loginType: string | null | undefined,
  username: string,
  encryptedMemo: string
): Promise<string> {
  if (loginType === "keychain") {
    return keychainDecode(username, encryptedMemo);
  }

  if (loginType === "hivesigner") {
    const result = await getDecodedMemo(username, encryptedMemo);
    if (result && result.result) {
      return result.result;
    }
    throw new Error("HiveSigner memo decode failed");
  }

  // For key/hiveauth, prompt for memo key
  const memoKey = getTempMemoKey() || (await requestMemoKey("decrypt"));
  if (!memoKey) {
    throw new Error("Memo key not provided");
  }

  return decryptMemoWithKeys(memoKey, encryptedMemo);
}

function keychainEncode(
  username: string,
  toAccount: string,
  memo: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const keychain = window.hive_keychain;
    if (!keychain) {
      reject(new Error("Hive Keychain extension is unavailable or disabled."));
      return;
    }
    keychain.requestEncodeMessage(
      username,
      toAccount,
      `#${memo}`,
      "Memo",
      (resp) => {
        if (!resp.success) {
          reject(new Error("Keychain memo encryption cancelled"));
          return;
        }
        resolve(resp.result);
      }
    );
  });
}

function keychainDecode(
  username: string,
  encryptedMemo: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const keychain = window.hive_keychain;
    if (!keychain) {
      reject(new Error("Hive Keychain extension is unavailable or disabled."));
      return;
    }
    keychain.requestVerifyKey(
      username,
      encryptedMemo,
      "Memo",
      (resp) => {
        if (!resp.success) {
          reject(new Error("Keychain memo decryption cancelled"));
          return;
        }
        resolve(resp.result);
      }
    );
  });
}
