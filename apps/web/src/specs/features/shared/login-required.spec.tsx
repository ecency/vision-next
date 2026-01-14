import { vi } from 'vitest';
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { LoginRequired } from "@/features/shared/login-required";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { useGlobalStore } from "@/core/global-store";

vi.mock("@/core/hooks/use-active-account", () => ({
  useActiveAccount: vi.fn()
}));

vi.mock("@/core/global-store", () => ({
  useGlobalStore: vi.fn()
}));

describe("LoginRequired", () => {
  const mockToggleUiProp = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    (useGlobalStore as any).mockImplementation((selector: any) => {
      return selector({ toggleUiProp: mockToggleUiProp });
    });
  });

  test("renders children when user is logged in", () => {
    (useActiveAccount as any).mockReturnValue({
      activeUser: { username: "testuser" }
    });

    render(
      <LoginRequired>
        <button>Protected Content</button>
      </LoginRequired>
    );

    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });

  test("does not render children when user is not logged in", () => {
    (useActiveAccount as any).mockReturnValue({
      activeUser: null
    });

    render(
      <LoginRequired>
        <button>Protected Content</button>
      </LoginRequired>
    );

    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });

  test("renders default login button when no children and user not logged in", () => {
    (useActiveAccount as any).mockReturnValue({
      activeUser: null
    });

    render(<LoginRequired />);

    expect(screen.getByText("Login to continue")).toBeInTheDocument();
  });

  test("calls toggleUiProp when default login button is clicked", () => {
    (useActiveAccount as any).mockReturnValue({
      activeUser: null
    });

    render(<LoginRequired />);

    fireEvent.click(screen.getByText("Login to continue"));

    expect(mockToggleUiProp).toHaveBeenCalledWith("login");
  });

  test("does not show child elements when user not logged in", () => {
    (useActiveAccount as any).mockReturnValue({
      activeUser: null
    });

    const originalOnClick = vi.fn();

    render(
      <LoginRequired>
        <button onClick={originalOnClick}>Click Me</button>
      </LoginRequired>
    );

    // Protected content should not be visible when not logged in
    expect(screen.queryByText("Click Me")).not.toBeInTheDocument();
    expect(mockToggleUiProp).not.toHaveBeenCalled();
    expect(originalOnClick).not.toHaveBeenCalled();
  });

  test("preserves original onClick when user is logged in", () => {
    (useActiveAccount as any).mockReturnValue({
      activeUser: { username: "testuser" }
    });

    const originalOnClick = vi.fn();

    render(
      <LoginRequired>
        <button onClick={originalOnClick}>Click Me</button>
      </LoginRequired>
    );

    const button = screen.getByText("Click Me");
    fireEvent.click(button);

    expect(originalOnClick).toHaveBeenCalled();
    expect(mockToggleUiProp).not.toHaveBeenCalled();
  });

  test("handles multiple children when logged in", () => {
    (useActiveAccount as any).mockReturnValue({
      activeUser: { username: "testuser" }
    });

    render(
      <LoginRequired>
        <div>
          <button>Button 1</button>
          <button>Button 2</button>
        </div>
      </LoginRequired>
    );

    expect(screen.getByText("Button 1")).toBeInTheDocument();
    expect(screen.getByText("Button 2")).toBeInTheDocument();
  });

  test("renders nothing when no children and user is logged in", () => {
    (useActiveAccount as any).mockReturnValue({
      activeUser: { username: "testuser" }
    });

    const { container } = render(<LoginRequired />);

    // When user is logged in but no children provided, should render nothing
    expect(container.firstChild).toBeNull();
  });

  test("updates when activeUser changes from null to defined", () => {
    (useActiveAccount as any).mockReturnValue({
      activeUser: null
    });

    const { rerender } = render(
      <LoginRequired>
        <button>Protected</button>
      </LoginRequired>
    );

    expect(screen.queryByText("Protected")).not.toBeInTheDocument();

    (useActiveAccount as any).mockReturnValue({
      activeUser: { username: "newuser" }
    });

    rerender(
      <LoginRequired>
        <button>Protected</button>
      </LoginRequired>
    );

    expect(screen.getByText("Protected")).toBeInTheDocument();
  });

  test("updates when activeUser changes from defined to null", () => {
    (useActiveAccount as any).mockReturnValue({
      activeUser: { username: "testuser" }
    });

    const { rerender } = render(
      <LoginRequired>
        <button>Protected</button>
      </LoginRequired>
    );

    expect(screen.getByText("Protected")).toBeInTheDocument();

    (useActiveAccount as any).mockReturnValue({
      activeUser: null
    });

    rerender(
      <LoginRequired>
        <button>Protected</button>
      </LoginRequired>
    );

    expect(screen.queryByText("Protected")).not.toBeInTheDocument();
  });

  test("does not show custom child components when not logged in", () => {
    (useActiveAccount as any).mockReturnValue({
      activeUser: null
    });

    const CustomComponent = ({ onClick }: { onClick?: () => void }) => (
      <div onClick={onClick} role="button">
        Custom Component
      </div>
    );

    render(
      <LoginRequired>
        <CustomComponent />
      </LoginRequired>
    );

    // Protected content should not be visible when not logged in
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
