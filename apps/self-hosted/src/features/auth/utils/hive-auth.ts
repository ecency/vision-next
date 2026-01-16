import type { Operation } from '@hiveio/dhive';
import CryptoJS from 'crypto-js';
import { HIVEAUTH_API, HIVEAUTH_APP } from '../constants';
import type { HiveAuthSession } from '../types';

interface HiveAuthChallenge {
  key_type: string;
  challenge: string;
}

interface HiveAuthAuthResponse {
  cmd: 'auth_ack' | 'auth_nack' | 'auth_wait' | 'auth_err';
  uuid?: string;
  expire?: number;
  token?: string;
  error?: string;
}

interface HiveAuthSignResponse {
  cmd: 'sign_ack' | 'sign_nack' | 'sign_wait' | 'sign_err';
  broadcast?: boolean;
  error?: string;
  data?: string;
}

type HiveAuthCallback = {
  onQRCode?: (qrData: string) => void;
  onWaiting?: () => void;
  onSuccess?: (session: HiveAuthSession) => void;
  onError?: (error: string) => void;
};

type HiveAuthSignCallback = {
  onWaiting?: () => void;
  onSuccess?: (data?: string) => void;
  onError?: (error: string) => void;
};

/**
 * Generate a random encryption key for HiveAuth
 */
function generateKey(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Encrypt challenge using AES-CBC with EVP_BytesToKey derivation
 * This matches HiveAuth's expected encryption format
 */
function encryptChallenge(challenge: string, key: string): string {
  // CryptoJS.AES.encrypt with a string key uses EVP_BytesToKey internally
  // which derives the AES key and IV using MD5 - this is what HiveAuth expects
  return CryptoJS.AES.encrypt(challenge, key).toString();
}

/**
 * Generate QR code data for HiveAuth login
 */
function generateQRData(
  username: string,
  uuid: string,
  key: string,
  challenge: HiveAuthChallenge
): string {
  const authData = {
    account: username,
    uuid,
    key,
    host: HIVEAUTH_API,
    ...challenge,
  };

  return `hiveauth://auth/${btoa(JSON.stringify(authData))}`;
}

/**
 * HiveAuth login flow
 */
export async function loginWithHiveAuth(
  username: string,
  callbacks: HiveAuthCallback
): Promise<void> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(HIVEAUTH_API);
    const key = generateKey();
    let uuid: string | null = null;
    let authTimeout: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      if (authTimeout) {
        clearTimeout(authTimeout);
        authTimeout = null;
      }
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };

    ws.onopen = () => {
      // Send auth request
      const challenge: HiveAuthChallenge = {
        key_type: 'posting',
        challenge: JSON.stringify({
          login: true,
          ts: Date.now(),
        }),
      };

      const authReq = {
        cmd: 'auth_req',
        account: username,
        data: {
          app: {
            name: HIVEAUTH_APP,
          },
          challenge: encryptChallenge(challenge.challenge, key),
          key_type: challenge.key_type,
        },
      };

      ws.send(JSON.stringify(authReq));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as HiveAuthAuthResponse;

        switch (msg.cmd) {
          case 'auth_wait':
            if (msg.uuid) {
              uuid = msg.uuid;
              const challenge: HiveAuthChallenge = {
                key_type: 'posting',
                challenge: JSON.stringify({
                  login: true,
                  ts: Date.now(),
                }),
              };
              const qrData = generateQRData(username, uuid, key, challenge);
              callbacks.onQRCode?.(qrData);
              callbacks.onWaiting?.();
            }
            break;

          case 'auth_ack':
            if (msg.token && msg.expire) {
              const session: HiveAuthSession = {
                username,
                token: msg.token,
                expire: msg.expire,
                key,
              };
              callbacks.onSuccess?.(session);
              cleanup();
              resolve();
            }
            break;

          case 'auth_nack':
            callbacks.onError?.('Authentication rejected');
            cleanup();
            reject(new Error('Authentication rejected'));
            break;

          case 'auth_err':
            callbacks.onError?.(msg.error || 'Authentication error');
            cleanup();
            reject(new Error(msg.error || 'Authentication error'));
            break;
        }
      } catch (error) {
        callbacks.onError?.('Failed to parse response');
        cleanup();
        reject(error);
      }
    };

    ws.onerror = () => {
      callbacks.onError?.('WebSocket connection error');
      cleanup();
      reject(new Error('WebSocket connection error'));
    };

    ws.onclose = () => {
      // Connection closed - ensure timeout is cleared
      if (authTimeout) {
        clearTimeout(authTimeout);
        authTimeout = null;
      }
    };

    // Timeout after 5 minutes
    authTimeout = setTimeout(() => {
      if (ws.readyState === WebSocket.OPEN) {
        callbacks.onError?.('Authentication timeout');
        cleanup();
        reject(new Error('Authentication timeout'));
      }
    }, 5 * 60 * 1000);
  });
}

/**
 * Broadcast operations with HiveAuth
 */
export async function broadcastWithHiveAuth(
  session: HiveAuthSession,
  operations: Operation[],
  callbacks?: HiveAuthSignCallback
): Promise<void> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(HIVEAUTH_API);
    let signTimeout: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      if (signTimeout) {
        clearTimeout(signTimeout);
        signTimeout = null;
      }
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };

    ws.onopen = () => {
      const signReq = {
        cmd: 'sign_req',
        account: session.username,
        token: session.token,
        data: {
          key_type: 'posting',
          ops: operations,
          broadcast: true,
        },
      };

      ws.send(JSON.stringify(signReq));
      callbacks?.onWaiting?.();
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as HiveAuthSignResponse;

        switch (msg.cmd) {
          case 'sign_wait':
            callbacks?.onWaiting?.();
            break;

          case 'sign_ack':
            callbacks?.onSuccess?.(msg.data);
            cleanup();
            resolve();
            break;

          case 'sign_nack':
            callbacks?.onError?.('Transaction rejected');
            cleanup();
            reject(new Error('Transaction rejected'));
            break;

          case 'sign_err':
            callbacks?.onError?.(msg.error || 'Signing error');
            cleanup();
            reject(new Error(msg.error || 'Signing error'));
            break;
        }
      } catch (error) {
        callbacks?.onError?.('Failed to parse response');
        cleanup();
        reject(error);
      }
    };

    ws.onerror = () => {
      callbacks?.onError?.('WebSocket connection error');
      cleanup();
      reject(new Error('WebSocket connection error'));
    };

    ws.onclose = () => {
      // Connection closed - ensure timeout is cleared
      if (signTimeout) {
        clearTimeout(signTimeout);
        signTimeout = null;
      }
    };

    // Timeout after 2 minutes for signing
    signTimeout = setTimeout(() => {
      if (ws.readyState === WebSocket.OPEN) {
        callbacks?.onError?.('Signing timeout');
        cleanup();
        reject(new Error('Signing timeout'));
      }
    }, 2 * 60 * 1000);
  });
}

/**
 * Check if HiveAuth session is valid
 */
export function isHiveAuthSessionValid(session: HiveAuthSession | null): boolean {
  if (!session) return false;
  return Date.now() < session.expire * 1000;
}
