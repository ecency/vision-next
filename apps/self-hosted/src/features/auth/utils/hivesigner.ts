import type { Operation } from '@hiveio/dhive';
import {
  HIVESIGNER_CLIENT_ID,
  HIVESIGNER_OAUTH_URL,
  HIVESIGNER_SCOPE,
} from '../constants';

/**
 * Generate Hivesigner OAuth URL
 */
export function getHivesignerLoginUrl(redirectUri: string, state?: string): string {
  const params = new URLSearchParams({
    client_id: HIVESIGNER_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: HIVESIGNER_SCOPE,
  });

  if (state) {
    params.set('state', state);
  }

  return `${HIVESIGNER_OAUTH_URL}?${params.toString()}`;
}

/**
 * Redirect to Hivesigner for login
 */
export function redirectToHivesigner(redirectUri?: string): void {
  const currentUrl = redirectUri || window.location.href;
  const loginUrl = getHivesignerLoginUrl(currentUrl);
  window.location.href = loginUrl;
}

/**
 * Parse Hivesigner callback parameters
 */
export function parseHivesignerCallback(
  search: string
): { accessToken: string; username: string; expiresIn: number } | null {
  const params = new URLSearchParams(search);

  const accessToken = params.get('access_token');
  const username = params.get('username');
  const expiresIn = params.get('expires_in');

  if (!accessToken || !username) {
    return null;
  }

  return {
    accessToken,
    username,
    expiresIn: expiresIn ? parseInt(expiresIn, 10) : 604800, // Default 7 days
  };
}

/**
 * Broadcast operations with Hivesigner
 */
export async function broadcastWithHivesigner(
  accessToken: string,
  operations: Operation[]
): Promise<unknown> {
  // Dynamic import to avoid bundling hivesigner if not used
  const hs = await import('hivesigner');

  const client = new hs.Client({
    accessToken,
    app: HIVESIGNER_CLIENT_ID,
  });

  return client.broadcast(operations);
}

/**
 * Check if URL contains Hivesigner callback params
 */
export function isHivesignerCallback(search: string): boolean {
  const params = new URLSearchParams(search);
  return params.has('access_token') && params.has('username');
}
