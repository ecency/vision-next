import { vi } from "vitest";
import { TextDecoder, TextEncoder } from "util";

global.TextEncoder = TextEncoder;
// @ts-ignore
global.TextDecoder = TextDecoder;

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

vi.mock("@ecency/sdk", () => ({
  ConfigManager: { setQueryClient: vi.fn() },
  CONFIG: {
    hiveClient: {
      database: { call: vi.fn() },
      broadcast: { sendOperations: vi.fn() }
    }
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
  usrActivity: vi.fn(),
  buildProfileMetadata: vi.fn(),
  parseProfileMetadata: vi.fn()
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
    APT: "APT",
    TON: "TON",
    TRON: "TRX",
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
