import { vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Alert } from "@ui/alert";

describe("Alert", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("renders alert component", () => {
      render(<Alert>Test Alert</Alert>);
      expect(screen.getByText("Test Alert")).toBeInTheDocument();
    });

    it("renders as a div element", () => {
      const { container } = render(<Alert>Alert</Alert>);
      const alert = container.firstChild;
      expect(alert?.nodeName).toBe("DIV");
    });

    it("renders empty alert", () => {
      const { container } = render(<Alert />);
      const alert = container.firstChild;
      expect(alert).toBeInTheDocument();
      expect(alert?.textContent).toBe("");
    });

    it("renders with children content", () => {
      render(
        <Alert>
          <span>Nested Content</span>
        </Alert>
      );
      expect(screen.getByText("Nested Content")).toBeInTheDocument();
    });
  });

  describe("Appearances", () => {
    it("applies primary appearance by default", () => {
      const { container } = render(<Alert>Primary</Alert>);
      const alert = container.firstChild as HTMLElement;
      expect(alert.className).toContain("bg-blue-dark-sky-040");
      expect(alert.className).toContain("text-blue-dark-sky");
      expect(alert.className).toContain("border-blue-dark-sky-030");
    });

    it("applies primary appearance explicitly", () => {
      const { container } = render(<Alert appearance="primary">Primary</Alert>);
      const alert = container.firstChild as HTMLElement;
      expect(alert.className).toContain("bg-blue-dark-sky-040");
    });

    it("applies secondary appearance", () => {
      const { container } = render(<Alert appearance="secondary">Secondary</Alert>);
      const alert = container.firstChild as HTMLElement;
      expect(alert.className).toContain("bg-gray-100");
      expect(alert.className).toContain("text-gray-600");
      expect(alert.className).toContain("border-gray-200");
    });

    it("applies success appearance", () => {
      const { container } = render(<Alert appearance="success">Success</Alert>);
      const alert = container.firstChild as HTMLElement;
      expect(alert.className).toContain("bg-green-040");
      expect(alert.className).toContain("text-green");
      expect(alert.className).toContain("border-green-030");
    });

    it("applies warning appearance", () => {
      const { container } = render(<Alert appearance="warning">Warning</Alert>);
      const alert = container.firstChild as HTMLElement;
      expect(alert.className).toContain("bg-warning-040");
      expect(alert.className).toContain("text-orange");
      expect(alert.className).toContain("border-warning-030");
    });

    it("applies danger appearance", () => {
      const { container } = render(<Alert appearance="danger">Danger</Alert>);
      const alert = container.firstChild as HTMLElement;
      expect(alert.className).toContain("bg-red-040");
      expect(alert.className).toContain("text-red");
      expect(alert.className).toContain("border-red-030");
    });
  });

  describe("Styling", () => {
    it("applies base alert styles", () => {
      const { container } = render(<Alert>Styled</Alert>);
      const alert = container.firstChild as HTMLElement;
      expect(alert.className).toContain("text-sm");
      expect(alert.className).toContain("p-3");
      expect(alert.className).toContain("rounded-xl");
    });

    it("applies custom className", () => {
      const { container } = render(<Alert className="custom-alert-class">Custom</Alert>);
      const alert = container.firstChild as HTMLElement;
      expect(alert).toHaveClass("custom-alert-class");
    });

    it("combines default and custom classes", () => {
      const { container } = render(<Alert className="my-custom-class">Alert</Alert>);
      const alert = container.firstChild as HTMLElement;
      expect(alert.className).toContain("text-sm");
      expect(alert.className).toContain("my-custom-class");
    });

    it("applies border styling", () => {
      const { container } = render(<Alert>Border</Alert>);
      const alert = container.firstChild as HTMLElement;
      expect(alert.className).toContain("border");
    });
  });

  describe("Dark Mode", () => {
    it("applies dark mode classes for primary appearance", () => {
      const { container } = render(<Alert appearance="primary">Dark</Alert>);
      const alert = container.firstChild as HTMLElement;
      expect(alert.className).toContain("dark:bg-dark-default");
      expect(alert.className).toContain("dark:border-dark-300");
      expect(alert.className).toContain("dark:text-gray-100");
    });

    it("applies dark mode opacity for secondary appearance", () => {
      const { container } = render(<Alert appearance="secondary">Dark</Alert>);
      const alert = container.firstChild as HTMLElement;
      expect(alert.className).toContain("dark:bg-opacity-[20%]");
      expect(alert.className).toContain("dark:border-opacity-[20%]");
    });

    it("applies dark mode opacity for success appearance", () => {
      const { container } = render(<Alert appearance="success">Dark</Alert>);
      const alert = container.firstChild as HTMLElement;
      expect(alert.className).toContain("dark:bg-opacity-[20%]");
      expect(alert.className).toContain("dark:border-opacity-[20%]");
    });

    it("applies dark mode opacity for warning appearance", () => {
      const { container } = render(<Alert appearance="warning">Dark</Alert>);
      const alert = container.firstChild as HTMLElement;
      expect(alert.className).toContain("dark:bg-opacity-[20%]");
      expect(alert.className).toContain("dark:border-opacity-[20%]");
      expect(alert.className).toContain("dark:text-warning-default");
    });

    it("applies dark mode opacity for danger appearance", () => {
      const { container } = render(<Alert appearance="danger">Dark</Alert>);
      const alert = container.firstChild as HTMLElement;
      expect(alert.className).toContain("dark:bg-opacity-[20%]");
      expect(alert.className).toContain("dark:border-opacity-[20%]");
    });
  });

  describe("Typography", () => {
    it("applies text-sm size", () => {
      const { container } = render(<Alert>Small Text</Alert>);
      const alert = container.firstChild as HTMLElement;
      expect(alert.className).toContain("text-sm");
    });

    it("renders with formatted text", () => {
      render(
        <Alert>
          <strong>Bold</strong> and <em>italic</em> text
        </Alert>
      );
      expect(screen.getByText("Bold")).toBeInTheDocument();
      expect(screen.getByText("italic")).toBeInTheDocument();
    });
  });

  describe("Padding and Spacing", () => {
    it("applies padding of p-3", () => {
      const { container } = render(<Alert>Padded</Alert>);
      const alert = container.firstChild as HTMLElement;
      expect(alert.className).toContain("p-3");
    });

    it("applies rounded-xl border radius", () => {
      const { container } = render(<Alert>Rounded</Alert>);
      const alert = container.firstChild as HTMLElement;
      expect(alert.className).toContain("rounded-xl");
    });
  });

  describe("HTML Attributes", () => {
    it("accepts custom id attribute", () => {
      const { container } = render(<Alert id="test-alert">ID Alert</Alert>);
      const alert = container.firstChild as HTMLElement;
      expect(alert).toHaveAttribute("id", "test-alert");
    });

    it("accepts custom data attributes", () => {
      const { container } = render(<Alert data-testid="alert-test">Data Alert</Alert>);
      const alert = container.firstChild as HTMLElement;
      expect(alert).toHaveAttribute("data-testid", "alert-test");
    });

    it("accepts custom style attribute", () => {
      const { container } = render(<Alert style={{ margin: "20px" }}>Styled</Alert>);
      const alert = container.firstChild as HTMLElement;
      expect(alert).toHaveStyle({ margin: "20px" });
    });

    it("accepts onClick handler", () => {
      const handleClick = vi.fn();
      render(<Alert onClick={handleClick}>Clickable</Alert>);
      const alert = screen.getByText("Clickable");
      alert.click();
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("accepts role attribute", () => {
      const { container } = render(<Alert role="alert">Role Alert</Alert>);
      const alert = container.firstChild as HTMLElement;
      expect(alert).toHaveAttribute("role", "alert");
    });
  });

  describe("Content Variations", () => {
    it("renders plain text", () => {
      render(<Alert>Plain Text</Alert>);
      expect(screen.getByText("Plain Text")).toBeInTheDocument();
    });

    it("renders with icon and text", () => {
      render(
        <Alert>
          <span data-testid="icon">⚠️</span>
          <span>Warning message</span>
        </Alert>
      );
      expect(screen.getByTestId("icon")).toBeInTheDocument();
      expect(screen.getByText("Warning message")).toBeInTheDocument();
    });

    it("renders with complex nested structure", () => {
      render(
        <Alert>
          <div>
            <h3>Title</h3>
            <p>Description</p>
          </div>
        </Alert>
      );
      expect(screen.getByText("Title")).toBeInTheDocument();
      expect(screen.getByText("Description")).toBeInTheDocument();
    });

    it("renders with link inside", () => {
      render(
        <Alert>
          Check out <a href="/docs">documentation</a> for more info.
        </Alert>
      );
      expect(screen.getByText("documentation")).toBeInTheDocument();
      expect(screen.getByText(/Check out/)).toBeInTheDocument();
    });

    it("renders multiline content", () => {
      render(
        <Alert>
          Line 1<br />
          Line 2<br />
          Line 3
        </Alert>
      );
      expect(screen.getByText(/Line 1/)).toBeInTheDocument();
      expect(screen.getByText(/Line 3/)).toBeInTheDocument();
    });
  });

  describe("Color Combinations", () => {
    it("primary has blue color scheme", () => {
      const { container } = render(<Alert appearance="primary">Primary</Alert>);
      const alert = container.firstChild as HTMLElement;
      expect(alert.className).toMatch(/blue/);
    });

    it("secondary has gray color scheme", () => {
      const { container } = render(<Alert appearance="secondary">Secondary</Alert>);
      const alert = container.firstChild as HTMLElement;
      expect(alert.className).toMatch(/gray/);
    });

    it("success has green color scheme", () => {
      const { container } = render(<Alert appearance="success">Success</Alert>);
      const alert = container.firstChild as HTMLElement;
      expect(alert.className).toMatch(/green/);
    });

    it("warning has orange color scheme", () => {
      const { container } = render(<Alert appearance="warning">Warning</Alert>);
      const alert = container.firstChild as HTMLElement;
      expect(alert.className).toMatch(/orange|warning/);
    });

    it("danger has red color scheme", () => {
      const { container } = render(<Alert appearance="danger">Danger</Alert>);
      const alert = container.firstChild as HTMLElement;
      expect(alert.className).toMatch(/red/);
    });
  });
});
