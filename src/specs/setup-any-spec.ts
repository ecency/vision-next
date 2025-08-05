import { TextDecoder, TextEncoder } from "util";

global.TextEncoder = TextEncoder;
// @ts-ignore
global.TextDecoder = TextDecoder;

jest.mock("i18next", () => ({
  __esModule: true,
  default: {
    t: jest.fn((key) => key),
    init: jest.fn()
  }
}));

jest.mock(
  "@ecency/sdk",
  () => ({
    ConfigManager: { setQueryClient: jest.fn() }
  }),
  { virtual: true }
);

jest.mock("@ecency/renderer", () => ({}), { virtual: true });
jest.mock("react-tweet", () => ({}), { virtual: true });
jest.mock("@/utils", () => ({ random: jest.fn() }), { virtual: true });
