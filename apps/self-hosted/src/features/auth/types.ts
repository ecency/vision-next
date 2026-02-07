export type AuthMethod = "hivesigner" | "keychain" | "hiveauth";

export interface AuthUser {
  username: string;
  accessToken?: string;
  refreshToken?: string;
  postingKey?: string;
  loginType: AuthMethod;
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

export interface HiveAuthSession {
  username: string;
  token: string;
  expire: number;
  key: string;
}
