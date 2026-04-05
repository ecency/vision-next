import { vi } from "vitest";
import { TextDecoder, TextEncoder } from "util";

// Polyfill for jsdom environment — use defineProperty because jsdom v26
// shadows simple global assignments with its own window descriptors.
Object.defineProperty(globalThis, "TextEncoder", { value: TextEncoder, writable: true, configurable: true });
Object.defineProperty(globalThis, "TextDecoder", { value: TextDecoder, writable: true, configurable: true });

// Mock uuid to avoid crypto dependency issues
vi.mock("uuid", () => ({
  v4: vi.fn(() => "test-uuid-1234")
}));

vi.mock("i18next", () => ({
  __esModule: true,
  default: {
    t: vi.fn((key) => key),
    init: vi.fn(),
    changeLanguage: vi.fn(),
    on: vi.fn()
  }
}));

vi.mock("@ecency/hive-tx", () => ({
  PrivateKey: { fromString: vi.fn(), fromLogin: vi.fn(), from: vi.fn() },
  PublicKey: { fromString: vi.fn(), from: vi.fn() },
  Signature: { from: vi.fn() },
  Transaction: vi.fn(),
  Memo: { encode: vi.fn(), decode: vi.fn() },
  callRPC: vi.fn(),
  callRPCBroadcast: vi.fn(),
  callREST: vi.fn(),
  callWithQuorum: vi.fn(),
  config: { nodes: [], timeout: 1000, address_prefix: "STM" },
  utils: { operations: {}, makeBitMaskFilter: vi.fn() },
}));

vi.mock("@ecency/sdk", () => ({
  ConfigManager: { setQueryClient: vi.fn() },
  CONFIG: {
    hiveNodes: [],
    privateApiHost: "https://ecency.com",
    imageHost: "https://images.ecency.com",
  },
  getBookmarksQueryOptions: vi.fn(),
  getAccountFullQueryOptions: vi.fn(() => ({ queryKey: ['account'], queryFn: vi.fn() })),
  getBoostPlusPricesQueryOptions: vi.fn(() => ({ queryKey: ['boost-prices'], queryFn: vi.fn() })),
  getPointsQueryOptions: vi.fn(() => ({ queryKey: ['points'], queryFn: vi.fn() })),
  getBoostPlusAccountPricesQueryOptions: vi.fn(() => ({ queryKey: ['boost-account'], queryFn: vi.fn() })),
  getDeletedEntryQueryOptions: vi.fn((author, permlink) => ({
    queryKey: ['posts', 'deleted-entry', `@${author}/${permlink}`],
    queryFn: vi.fn()
  })),
  useBookmarkAdd: vi.fn(),
  useBookmarkDelete: vi.fn(),
  useAccountRevokeKey: vi.fn(() => ({ mutateAsync: vi.fn() })),
  usrActivity: vi.fn(),
  buildProfileMetadata: vi.fn(),
  parseProfileMetadata: vi.fn(),
  canRevokeFromAuthority: vi.fn(() => true),
  buildRevokeKeysOp: vi.fn(() => ({})),
  // hive-tx compat layer re-exports
  broadcastOperations: vi.fn(),
  isWif: vi.fn(() => false),
  sha256: vi.fn(() => new Uint8Array(32)),
  calculateVPMana: vi.fn(() => ({ percentage: 10000, current_mana: 0, max_mana: 0 })),
  calculateRCMana: vi.fn(() => ({ percentage: 10000, current_mana: 0, max_mana: 0 })),
  callRPC: vi.fn(),
  hiveTxUtils: { operations: {}, makeBitMaskFilter: vi.fn() },
  hiveTxConfig: { nodes: [], timeout: 1000, address_prefix: "STM" },
  initHiveTx: vi.fn(),
  setHiveTxNodes: vi.fn(),
  dedupeAndSortKeyAuths: vi.fn((...args: any[]) => args[0] || []),
  buildGrantPostingPermissionOp: vi.fn(),
}));

vi.mock("@/features/post-renderer", () => ({
  EcencyRenderer: () => null,
  setupPostEnhancements: vi.fn()
}));

vi.mock("@ecency/wallets", () => ({
  validateKey: vi.fn(),
  validateWif: vi.fn(),
  EXTERNAL_BLOCKCHAINS: [],
  useGetHiveEngineTokensBalances: vi.fn(),
  useGetSpkWallet: vi.fn(),
  EcencyWalletCurrency: {
    BTC: "BTC",
    ETH: "ETH",
    BNB: "BNB",
    SOL: "SOL"
  }
}));

vi.mock("@/core/hooks/use-active-account", () => ({
  useActiveAccount: vi.fn(() => ({
    activeUser: null,
    username: null,
    account: null,
    isLoading: false,
    isPending: false,
    isError: false,
    isSuccess: false,
    error: null,
    refetch: vi.fn()
  }))
}));

vi.mock("react-tweet", () => ({}));
vi.mock("@/utils", () => ({
  random: vi.fn(),
  getAccessToken: vi.fn(() => "mock-token")
}));
