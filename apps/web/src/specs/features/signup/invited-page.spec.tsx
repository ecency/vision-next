import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { renderWithQueryClient } from "@/specs/test-utils";

vi.mock("@ecency/wallets", () => ({
  deriveHiveMasterPasswordKeys: vi.fn(() => ({
    owner: "5Jowner", active: "5Jactive", posting: "5Jposting", memo: "5Jmemo",
    ownerPubkey: "STMowner", activePubkey: "STMactive",
    postingPubkey: "STMposting", memoPubkey: "STMmemo"
  }))
}));
vi.mock("@/utils/master-password", () => ({
  generateMasterPassword: vi.fn(() => "P5TestMasterPassword123456")
}));
vi.mock("@/features/wallet", () => ({
  useDownloadKeys: vi.fn(() => vi.fn())
}));
vi.mock("@/utils/clipboard", () => ({
  clipboard: vi.fn()
}));
vi.mock("@/features/shared", () => ({
  error: vi.fn(),
  success: vi.fn()
}));
vi.mock("@/utils", () => ({
  random: vi.fn(),
  getAccessToken: vi.fn(() => "mock-token"),
  b64uEnc: vi.fn(() => "encoded"),
  getUsernameError: vi.fn(() => ""),
  handleInvalid: vi.fn(),
  handleOnInput: vi.fn()
}));
vi.mock("react-use/lib/useDebounce", () => ({
  __esModule: true,
  default: vi.fn()
}));

import InvitedSignupPage from "@/app/signup/invited/page";

describe("InvitedSignupPage", () => {
  it("renders username and email inputs initially", () => {
    renderWithQueryClient(<InvitedSignupPage />);
    expect(screen.getByPlaceholderText("sign-up.username")).toBeDefined();
    expect(screen.getByPlaceholderText("sign-up.email")).toBeDefined();
  });

  it("shows continue button", () => {
    renderWithQueryClient(<InvitedSignupPage />);
    expect(screen.getByText("g.continue")).toBeDefined();
  });

  it("does not show master password before continuing", () => {
    renderWithQueryClient(<InvitedSignupPage />);
    expect(screen.queryByText("P5TestMasterPassword123456")).toBeNull();
  });
});
