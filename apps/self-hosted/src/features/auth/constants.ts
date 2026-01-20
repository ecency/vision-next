// Storage keys
export const STORAGE_KEY = 'ecency_selfhost_user';
export const HIVEAUTH_KEY = 'ecency_selfhost_hiveauth';

// Hivesigner OAuth
export const HIVESIGNER_CLIENT_ID = 'ecency.app';
export const HIVESIGNER_OAUTH_URL = 'https://hivesigner.com/oauth2/authorize';
export const HIVESIGNER_TOKEN_URL = 'https://hivesigner.com/api/oauth2/token';
export const HIVESIGNER_SCOPE = 'vote,comment,custom_json';

// HiveAuth
export const HIVEAUTH_API = 'wss://hiveauth.arcange.eu';
export const HIVEAUTH_APP = 'ecency.selfhost';
export const HIVEAUTH_KEY_PREFIX = 'ecency_ha_';

// Session duration (7 days in ms)
export const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000;

// Auth method labels
export const AUTH_METHOD_LABELS: Record<string, string> = {
  hivesigner: 'Hivesigner',
  keychain: 'Hive Keychain',
  hiveauth: 'HiveAuth',
};

// Auth method descriptions
export const AUTH_METHOD_DESCRIPTIONS: Record<string, string> = {
  hivesigner: 'Login with your Hive account via Hivesigner',
  keychain: 'Login using the Hive Keychain browser extension',
  hiveauth: 'Scan QR code with HiveAuth mobile app',
};
