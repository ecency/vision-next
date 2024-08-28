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
