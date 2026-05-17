import { describe, it, expect } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ProfileWalletPromoCarousel } from "@/app/(dynamicPages)/profile/[username]/wallet/(token)/_components/profile-wallet-promo-carousel";

describe("ProfileWalletPromoCarousel", () => {
  it("renders a single slide bare with no dots/chrome", () => {
    render(
      <ProfileWalletPromoCarousel slides={[<div key="a">Slide A</div>]} />
    );

    expect(screen.getByText("Slide A")).toBeInTheDocument();
    // No dot navigation buttons when only one slide is eligible
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("filters out falsy slides before deciding chrome", () => {
    render(
      <ProfileWalletPromoCarousel
        slides={[false, <div key="b">Only B</div>]}
      />
    );

    expect(screen.getByText("Only B")).toBeInTheDocument();
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("shows one dot per slide with the first active", () => {
    render(
      <ProfileWalletPromoCarousel
        slides={[
          <div key="a">Slide A</div>,
          <div key="b">Slide B</div>
        ]}
      />
    );

    const dots = screen.getAllByRole("button");
    expect(dots).toHaveLength(2);
    expect(dots[0]).toHaveAttribute("aria-current", "true");
    expect(dots[1]).toHaveAttribute("aria-current", "false");
  });

  it("navigates to a slide when its dot is clicked", () => {
    const { container } = render(
      <ProfileWalletPromoCarousel
        slides={[
          <div key="a">Slide A</div>,
          <div key="b">Slide B</div>
        ]}
      />
    );

    const track = container.querySelector("[style*='translateX']") as HTMLElement;
    expect(track.style.transform).toContain("calc(0%");

    const dots = screen.getAllByRole("button");
    fireEvent.click(dots[1]);

    expect(dots[1]).toHaveAttribute("aria-current", "true");
    expect(dots[0]).toHaveAttribute("aria-current", "false");
    expect(track.style.transform).toContain("-100%");
  });
});
