import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import "@testing-library/jest-dom";

vi.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />
}));

vi.mock("@ui/button", () => ({
  Button: ({ children, onClick, icon, className, ...rest }: any) => (
    <button onClick={onClick} className={className} {...rest}>
      {icon}
      {children}
    </button>
  )
}));

import { MetaMaskSignButton } from "@/features/shared/metamask-sign-button";

describe("MetaMaskSignButton", () => {
  it("renders sign with metamask text", () => {
    render(<MetaMaskSignButton onClick={vi.fn()} />);
    expect(screen.getByText("key-or-hot.sign-with-metamask")).toBeInTheDocument();
  });

  it("renders metamask fox icon", () => {
    render(<MetaMaskSignButton onClick={vi.fn()} />);
    expect(screen.getByAltText("metamask")).toBeInTheDocument();
    expect(screen.getByAltText("metamask")).toHaveAttribute("src", "/assets/metamask-fox.svg");
  });

  it("calls onClick when clicked", () => {
    const onClick = vi.fn();
    render(<MetaMaskSignButton onClick={onClick} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
