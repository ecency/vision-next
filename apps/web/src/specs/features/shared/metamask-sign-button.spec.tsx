import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />
}));

import { MetaMaskSignButton } from "@/features/shared/metamask-sign-button";

describe("MetaMaskSignButton", () => {
  it("renders the sign with metamask text", () => {
    render(<MetaMaskSignButton onClick={vi.fn()} />);
    expect(screen.getByText("key-or-hot.sign-with-metamask")).toBeDefined();
  });

  it("renders the metamask fox icon", () => {
    render(<MetaMaskSignButton onClick={vi.fn()} />);
    const img = screen.getByAltText("metamask");
    expect(img).toBeDefined();
    expect(img.getAttribute("src")).toBe("/assets/metamask-fox.svg");
  });

  it("calls onClick when clicked", () => {
    const onClick = vi.fn();
    render(<MetaMaskSignButton onClick={onClick} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
