import { TextDecoder, TextEncoder } from "util";

global.TextEncoder = TextEncoder;
// @ts-ignore
global.TextDecoder = TextDecoder;

jest.mock("i18next", () => ({
  __esModule: true,
  default: {
    t: jest.fn((key) => key),
    init: jest.fn(),
    changeLanguage: jest.fn(),
    on: jest.fn()
  }
}));

jest.mock(
  "@ecency/sdk",
  () => ({
    ConfigManager: { setQueryClient: jest.fn() },
    CONFIG: {
      hiveClient: {
        database: { call: jest.fn() },
        broadcast: { sendOperations: jest.fn() }
      }
    },
    getActiveAccountBookmarksQueryOptions: jest.fn(),
    getAccountFullQueryOptions: jest.fn(() => ({ queryKey: ['account'], queryFn: jest.fn() })),
    getBoostPlusPricesQueryOptions: jest.fn(() => ({ queryKey: ['boost-prices'], queryFn: jest.fn() })),
    getPointsQueryOptions: jest.fn(() => ({ queryKey: ['points'], queryFn: jest.fn() })),
    getBoostPlusAccountPricesQueryOptions: jest.fn(() => ({ queryKey: ['boost-account'], queryFn: jest.fn() })),
    useBookmarkAdd: jest.fn(),
    useBookmarkDelete: jest.fn(),
    usrActivity: jest.fn(),
    buildProfileMetadata: jest.fn(),
    parseProfileMetadata: jest.fn()
  }),
  { virtual: true }
);

jest.mock(
  "@ecency/renderer",
  () => ({
    EcencyRenderer: () => null,
    setupPostEnhancements: jest.fn()
  }),
  { virtual: true }
);

jest.mock(
  "@ecency/wallets",
  () => ({
    validateKey: jest.fn(),
    validateWif: jest.fn(),
    EXTERNAL_BLOCKCHAINS: [],
    useGetHiveEngineTokensBalances: jest.fn(),
    useGetSpkWallet: jest.fn(),
    EcencyWalletCurrency: {
      BTC: "BTC",
      ETH: "ETH",
      BNB: "BNB",
      APT: "APT",
      TON: "TON",
      TRON: "TRX",
      SOL: "SOL"
    }
  }),
  { virtual: true }
);

jest.mock("@/core/hooks/use-active-account", () => ({
  useActiveAccount: jest.fn(() => ({
    activeUser: null,
    username: null,
    account: null,
    isLoading: false,
    isPending: false,
    isError: false,
    isSuccess: false,
    error: null,
    refetch: jest.fn()
  }))
}), { virtual: true });

jest.mock("react-tweet", () => ({}), { virtual: true });
jest.mock("@/utils", () => ({
  random: jest.fn(),
  getAccessToken: jest.fn(() => "mock-token")
}), { virtual: true });
