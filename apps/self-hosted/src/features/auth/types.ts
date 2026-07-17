export type AuthMethod = "hivesigner" | "keychain" | "hiveauth";

/** Keychain-compatible browser extensions the app can sign with. */
export type HiveExtensionId = "keychain" | "hive-keeper" | "peakvault";

export interface AuthUser {
  username: string;
  accessToken?: string;
  refreshToken?: string;
  postingKey?: string;
  loginType: AuthMethod;
  /** Which browser extension signs for this session (loginType "keychain" only). */
  extension?: HiveExtensionId;
  expiresAt?: number;
}

export interface AuthConfig {
  enabled: boolean;
  methods: AuthMethod[];
}

export interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAuthEnabled: boolean;
  availableMethods: AuthMethod[];
  isBlogOwner: boolean;
  /** True if the session will expire within 5 minutes */
  isSessionExpiringSoon: boolean;
}

export interface KeychainResponse {
  success: boolean;
  error?: string;
  result?: string;
  data?: {
    username?: string;
    message?: string;
  };
  message?: string;
  publicKey?: string;
}

export interface KeychainSignTxResponse {
  success: boolean;
  error?: string;
  result?: string;
  data?: {
    /** The signed transaction object (JSON string) */
    tx?: string;
  };
  message?: string;
}

export interface HiveAuthSession {
  username: string;
  token: string;
  expire: number;
  key: string;
}
