import type { Operation } from '@hiveio/dhive';
import type { KeychainResponse } from '../types';

type AuthorityType = 'Owner' | 'Active' | 'Posting' | 'Memo';

interface HiveKeychain {
  requestHandshake: (callback: () => void) => void;
  requestSignBuffer: (
    account: string,
    message: string,
    authType: AuthorityType,
    callback: (response: KeychainResponse) => void,
    rpc?: string | null
  ) => void;
  requestBroadcast: (
    account: string,
    operations: Operation[],
    authType: AuthorityType,
    callback: (response: KeychainResponse) => void,
    rpc?: string | null
  ) => void;
}

declare global {
  interface Window {
    hive_keychain?: HiveKeychain;
  }
}

/**
 * Check if Keychain extension is available
 */
export function isKeychainAvailable(): boolean {
  return typeof window !== 'undefined' && !!window.hive_keychain;
}

/**
 * Request handshake with Keychain
 */
export function handshake(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const keychain = window.hive_keychain;
    if (!keychain) {
      reject(new Error('Hive Keychain extension is unavailable or disabled.'));
      return;
    }
    keychain.requestHandshake(() => {
      resolve();
    });
  });
}

/**
 * Sign a buffer/message with Keychain
 */
export function signBuffer(
  account: string,
  message: string,
  authType: AuthorityType = 'Posting'
): Promise<KeychainResponse> {
  return new Promise<KeychainResponse>((resolve, reject) => {
    const keychain = window.hive_keychain;
    if (!keychain) {
      reject(new Error('Hive Keychain extension is unavailable or disabled.'));
      return;
    }
    keychain.requestSignBuffer(account, message, authType, (resp) => {
      if (!resp.success) {
        reject(new Error(resp.error || 'Operation cancelled'));
        return;
      }
      resolve(resp);
    });
  });
}

/**
 * Broadcast operations with Keychain
 */
export function broadcast(
  account: string,
  operations: Operation[],
  authType: AuthorityType = 'Posting'
): Promise<KeychainResponse> {
  return new Promise<KeychainResponse>((resolve, reject) => {
    const keychain = window.hive_keychain;

    if (!keychain) {
      reject(new Error('Hive Keychain extension is unavailable or disabled.'));
      return;
    }

    let finished = false;
    const timeout = setTimeout(() => {
      if (!finished) {
        reject(new Error('Hive Keychain response timeout'));
      }
    }, 30000);

    keychain.requestBroadcast(account, operations, authType, (resp) => {
      finished = true;
      clearTimeout(timeout);
      if (!resp.success) {
        reject(new Error(resp.error || 'Operation cancelled'));
        return;
      }
      resolve(resp);
    });
  });
}

/**
 * Login with Keychain by signing a challenge
 */
export async function loginWithKeychain(username: string): Promise<string> {
  // First handshake
  await handshake();

  // Create a challenge message
  const challenge = `Login to Ecency Blog: ${Date.now()}`;

  // Sign the challenge
  const response = await signBuffer(username, challenge, 'Posting');

  if (!response.success) {
    throw new Error('Failed to sign login challenge');
  }

  return username;
}
