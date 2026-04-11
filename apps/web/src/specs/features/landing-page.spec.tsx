import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock global store
const mockToggleUiProp = vi.fn();
let mockTheme = "day";
vi.mock("@/core/global-store", () => ({
  useGlobalStore: vi.fn((selector: any) => {
    const state = {
      theme: mockTheme,
      toggleUiProp: mockToggleUiProp
    };
    return selector(state);
  })
}));

// Mock subscribeEmail - extend the global @ecency/sdk mock
const mockSubscribeEmail = vi.fn();
vi.mock("@ecency/sdk", async (importOriginal) => {
  const actual = await importOriginal<any>();
  return { ...actual, subscribeEmail: (...args: any[]) => mockSubscribeEmail(...args) };
});

vi.mock("@/features/shared/feedback", () => ({
  error: vi.fn(),
  success: vi.fn()
}));

vi.mock("@/features/shared/linear-progress", () => ({
  LinearProgress: () => <div data-testid="linear-progress" />
}));

vi.mock("@ui/svg", async (importOriginal) => {
  const actual = await importOriginal<any>();
  return { ...actual, scrollDown: "<svg data-testid='scroll-down-icon' />" };
});

// Extend the global @/utils mock with landing-page-specific exports
vi.mock("@/utils", async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    handleInvalid: vi.fn(),
    handleOnInput: vi.fn()
  };
});

import { LandingHeroActions } from "@/app/_components/landing-page/landing-hero-actions";
import { LandingSubscribeForm } from "@/app/_components/landing-page/landing-subscribe-form";
import { LandingSignInLink } from "@/app/_components/landing-page/landing-sign-in-link";
import { LandingDownloadLinks } from "@/app/_components/landing-page/landing-download-links";
import { success, error as errorFn } from "@/features/shared/feedback";

describe("LandingHeroActions", () => {
  it("renders explore and get started links", () => {
    render(<LandingHeroActions />);
    expect(screen.getByText("landing-page.explore")).toBeInTheDocument();
    expect(screen.getByText("landing-page.get-started")).toBeInTheDocument();
  });

  it("renders accessible scroll button", () => {
    render(<LandingHeroActions />);
    const scrollBtn = screen.getByRole("button", { name: "Scroll to Earn Money" });
    expect(scrollBtn).toBeInTheDocument();
    expect(scrollBtn).toHaveClass("scroll-down");
  });

  it("scrolls to earn-money section on click", () => {
    const mockScrollIntoView = vi.fn();
    const mockElement = { scrollIntoView: mockScrollIntoView };
    const spy = vi.spyOn(document, "getElementById").mockReturnValue(mockElement as any);

    render(<LandingHeroActions />);
    fireEvent.click(screen.getByRole("button", { name: "Scroll to Earn Money" }));
    expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: "smooth" });

    spy.mockRestore();
  });
});

describe("LandingSubscribeForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders email input and submit button", () => {
    render(<LandingSubscribeForm />);
    expect(screen.getByPlaceholderText("landing-page.enter-your-email-adress")).toBeInTheDocument();
    expect(screen.getByText("landing-page.send")).toBeInTheDocument();
  });

  it("calls subscribeEmail on submit and shows success for 2xx", async () => {
    mockSubscribeEmail.mockResolvedValue({ status: 200 });

    render(<LandingSubscribeForm />);
    const input = screen.getByPlaceholderText("landing-page.enter-your-email-adress");
    fireEvent.change(input, { target: { value: "test@example.com" } });
    const form = input.closest("form");
    expect(form).not.toBeNull();
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(mockSubscribeEmail).toHaveBeenCalledWith("test@example.com");
      expect(success).toHaveBeenCalledWith("landing-page.success-message-subscribe");
    });
  });

  it("shows error on API failure", async () => {
    mockSubscribeEmail.mockRejectedValue(new Error("Network error"));

    render(<LandingSubscribeForm />);
    const input = screen.getByPlaceholderText("landing-page.enter-your-email-adress");
    fireEvent.change(input, { target: { value: "test@example.com" } });
    const form = input.closest("form");
    expect(form).not.toBeNull();
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(errorFn).toHaveBeenCalledWith("landing-page.error-occured");
    });
  });

  it("resets email and loading state in finally block", async () => {
    mockSubscribeEmail.mockResolvedValue({ status: 200 });

    render(<LandingSubscribeForm />);
    const input = screen.getByPlaceholderText("landing-page.enter-your-email-adress") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "test@example.com" } });
    const form = input.closest("form");
    expect(form).not.toBeNull();
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(input.value).toBe("");
      expect(screen.getByText("landing-page.send")).toBeInTheDocument();
    });
  });
});

describe("LandingSignInLink", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders as a button element", () => {
    render(<LandingSignInLink />);
    const btn = screen.getByRole("button", { name: "landing-page.sign-in" });
    expect(btn).toBeInTheDocument();
    expect(btn.tagName).toBe("BUTTON");
  });

  it("triggers login dialog on click", () => {
    render(<LandingSignInLink />);
    fireEvent.click(screen.getByRole("button", { name: "landing-page.sign-in" }));
    expect(mockToggleUiProp).toHaveBeenCalledWith("login");
  });
});

describe("LandingDownloadLinks", () => {
  const props = {
    iosIcon: "/icon-apple.svg",
    iosIconWhite: "/icon-apple-white.svg",
    androidIcon: "/icon-android.svg",
    androidIconWhite: "/icon-android-white.svg"
  };

  it("renders iOS and Android links with correct targets and security attrs", () => {
    render(<LandingDownloadLinks {...props} />);
    const externalLinks = screen
      .getAllByRole("link")
      .filter((link) => link.getAttribute("target") === "_blank");
    // iOS and Android are the only external links; the PWA install entry
    // is an internal /mobile link.
    expect(externalLinks).toHaveLength(2);
    externalLinks.forEach((link) => {
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });
  });

  it("renders the internal PWA install link pointing to /mobile", () => {
    render(<LandingDownloadLinks {...props} />);
    const pwaLink = screen.getByRole("link", {
      name: /landing-page\.install-web-app/
    });
    expect(pwaLink).toHaveAttribute("href", "/mobile");
    // The PWA link must not have target=_blank since it's an in-app route.
    expect(pwaLink).not.toHaveAttribute("target");
  });

  it("shows day theme icons when theme is day", () => {
    mockTheme = "day";
    render(<LandingDownloadLinks {...props} />);
    const images = screen.getAllByRole("img");
    expect(images[0]).toHaveAttribute("src", "/icon-apple.svg");
    expect(images[1]).toHaveAttribute("src", "/icon-android.svg");
  });

  it("shows night theme icons when theme is night", () => {
    mockTheme = "night";
    render(<LandingDownloadLinks {...props} />);
    const images = screen.getAllByRole("img");
    expect(images[0]).toHaveAttribute("src", "/icon-apple-white.svg");
    expect(images[1]).toHaveAttribute("src", "/icon-android-white.svg");
    mockTheme = "day"; // reset
  });
});
