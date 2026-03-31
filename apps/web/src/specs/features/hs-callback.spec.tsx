import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";

const mockPush = vi.fn();
let mockSearchParams: URLSearchParams;

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ push: mockPush })),
  useSearchParams: vi.fn(() => mockSearchParams),
}));

vi.mock("@/features/shared/navbar", () => ({
  Navbar: () => <div data-testid="navbar" />,
}));

vi.mock("@/features/shared/theme", () => ({
  Theme: () => <div data-testid="theme" />,
}));

import HsCallback from "@/app/auth/hs-callback/page";
import { HsCallbackPage } from "@/app/auth/hs-callback/_page";

describe("HsCallback route", () => {
  it("renders Theme, Navbar and HsCallbackPage", () => {
    mockSearchParams = new URLSearchParams();
    render(<HsCallback />);
    expect(screen.getByTestId("theme")).toBeDefined();
    expect(screen.getByTestId("navbar")).toBeDefined();
    expect(screen.getByText("g.error")).toBeDefined();
  });
});

describe("HsCallbackPage", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockPush.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows success UI when txId is present", () => {
    mockSearchParams = new URLSearchParams({ id: "abc123", redirect: "/@user/wallet" });
    render(<HsCallbackPage />);

    expect(screen.getByText("g.success")).toBeDefined();
    expect(screen.getByText("transactions.success-hint")).toBeDefined();
    expect(screen.getByText("abc123")).toBeDefined();
  });

  it("shows success UI when block is present", () => {
    mockSearchParams = new URLSearchParams({ block: "12345" });
    render(<HsCallbackPage />);

    expect(screen.getByText("g.success")).toBeDefined();
  });

  it("shows error UI when no txId or block", () => {
    mockSearchParams = new URLSearchParams();
    render(<HsCallbackPage />);

    expect(screen.getByText("g.error")).toBeDefined();
    expect(screen.getByText("transactions.error-hint")).toBeDefined();
  });

  it("redirects after countdown reaches 0", () => {
    mockSearchParams = new URLSearchParams({ id: "tx1", redirect: "/@user/wallet" });
    render(<HsCallbackPage />);

    expect(mockPush).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1000));
    act(() => vi.advanceTimersByTime(1000));
    act(() => vi.advanceTimersByTime(1000));

    expect(mockPush).toHaveBeenCalledWith("/@user/wallet");
  });

  it("defaults redirect to / when not provided", () => {
    mockSearchParams = new URLSearchParams({ id: "tx1" });
    render(<HsCallbackPage />);

    act(() => vi.advanceTimersByTime(1000));
    act(() => vi.advanceTimersByTime(1000));
    act(() => vi.advanceTimersByTime(1000));

    expect(mockPush).toHaveBeenCalledWith("/");
  });

  it("sanitizes redirect to prevent open-redirect attacks", () => {
    mockSearchParams = new URLSearchParams({ id: "tx1", redirect: "https://evil.com" });
    render(<HsCallbackPage />);

    act(() => vi.advanceTimersByTime(1000));
    act(() => vi.advanceTimersByTime(1000));
    act(() => vi.advanceTimersByTime(1000));

    expect(mockPush).toHaveBeenCalledWith("/");
  });

  it("sanitizes protocol-relative redirect URLs", () => {
    mockSearchParams = new URLSearchParams({ id: "tx1", redirect: "//evil.com" });
    render(<HsCallbackPage />);

    act(() => vi.advanceTimersByTime(1000));
    act(() => vi.advanceTimersByTime(1000));
    act(() => vi.advanceTimersByTime(1000));

    expect(mockPush).toHaveBeenCalledWith("/");
  });

  it("sanitizes javascript: protocol redirect URLs", () => {
    mockSearchParams = new URLSearchParams({ id: "tx1", redirect: "javascript:alert(1)" });
    render(<HsCallbackPage />);

    act(() => vi.advanceTimersByTime(1000));
    act(() => vi.advanceTimersByTime(1000));
    act(() => vi.advanceTimersByTime(1000));

    expect(mockPush).toHaveBeenCalledWith("/");
  });
});
