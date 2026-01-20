import type { Operation } from '@hiveio/dhive';

export type AuthMethod = 'hivesigner' | 'keychain' | 'hiveauth';

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
  isLoading: boolean;
  isAuthEnabled: boolean;
  availableMethods: AuthMethod[];
  isBlogOwner: boolean;
  /** True if the session will expire within 5 minutes */
  isSessionExpiringSoon: boolean;
  login: (method: AuthMethod, username: string) => Promise<void>;
  loginWithHivesigner: () => void;
  logout: () => void;
  broadcast: (operations: Operation[]) => Promise<unknown>;
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
