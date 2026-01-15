import { vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Badge } from "@ui/badge";

describe("Badge", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("renders badge component", () => {
      render(<Badge>Test Badge</Badge>);
      expect(screen.getByText("Test Badge")).toBeInTheDocument();
    });

    it("renders as a div element", () => {
      const { container } = render(<Badge>Badge</Badge>);
      const badge = container.firstChild;
      expect(badge?.nodeName).toBe("DIV");
    });

    it("renders empty badge", () => {
      const { container } = render(<Badge />);
      const badge = container.firstChild;
      expect(badge).toBeInTheDocument();
      expect(badge?.textContent).toBe("");
    });

    it("renders with children content", () => {
      render(
        <Badge>
          <span>Nested Content</span>
        </Badge>
      );
      expect(screen.getByText("Nested Content")).toBeInTheDocument();
    });
  });

  describe("Appearances", () => {
    it("applies primary appearance by default", () => {
      const { container } = render(<Badge>Primary</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain("bg-blue-dark-sky-040");
      expect(badge.className).toContain("text-blue-dark-sky");
    });

    it("applies primary appearance explicitly", () => {
      const { container } = render(<Badge appearance="primary">Primary</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain("bg-blue-dark-sky-040");
      expect(badge.className).toContain("border-blue-dark-sky-030");
    });

    it("applies secondary appearance", () => {
      const { container } = render(<Badge appearance="secondary">Secondary</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain("bg-gray-400");
      expect(badge.className).toContain("text-gray-600");
    });
  });

  describe("Styling", () => {
    it("applies base badge styles", () => {
      const { container } = render(<Badge>Styled</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain("inline-flex");
      expect(badge.className).toContain("items-center");
      expect(badge.className).toContain("rounded-full");
      expect(badge.className).toContain("px-2");
      expect(badge.className).toContain("py-0.5");
      expect(badge.className).toContain("text-sm");
    });

    it("applies custom className", () => {
      const { container } = render(<Badge className="custom-badge-class">Custom</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass("custom-badge-class");
    });

    it("combines default and custom classes", () => {
      const { container } = render(<Badge className="my-custom-class">Badge</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain("inline-flex");
      expect(badge.className).toContain("my-custom-class");
    });
  });

  describe("Dark Mode", () => {
    it("applies dark mode classes for primary appearance", () => {
      const { container } = render(<Badge appearance="primary">Dark</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain("dark:bg-dark-default");
      expect(badge.className).toContain("dark:border-blue-metallic-20");
      expect(badge.className).toContain("dark:text-gray-200");
    });

    it("applies dark mode classes for secondary appearance", () => {
      const { container } = render(<Badge appearance="secondary">Dark</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain("dark:bg-gray-600");
      expect(badge.className).toContain("dark:text-gray-400");
      expect(badge.className).toContain("dark:border-gray-600");
    });
  });

  describe("Border Styling", () => {
    it("includes border in primary appearance", () => {
      const { container } = render(<Badge appearance="primary">Border</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain("border");
      expect(badge.className).toContain("border-blue-dark-sky-030");
    });

    it("includes border in secondary appearance", () => {
      const { container } = render(<Badge appearance="secondary">Border</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain("border");
      expect(badge.className).toContain("border-gray-400");
    });
  });

  describe("Typography", () => {
    it("applies text-sm size", () => {
      const { container } = render(<Badge>Small Text</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain("text-sm");
    });

    it("applies font-bold for primary", () => {
      const { container } = render(<Badge appearance="primary">Bold</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain("font-bold");
    });

    it("applies font-bold for secondary", () => {
      const { container } = render(<Badge appearance="secondary">Bold</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain("font-bold");
    });
  });

  describe("HTML Attributes", () => {
    it("accepts custom id attribute", () => {
      const { container } = render(<Badge id="test-badge">ID Badge</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveAttribute("id", "test-badge");
    });

    it("accepts custom data attributes", () => {
      const { container } = render(<Badge data-testid="badge-test">Data Badge</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveAttribute("data-testid", "badge-test");
    });

    it("accepts custom style attribute", () => {
      const { container } = render(<Badge style={{ margin: "10px" }}>Styled</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveStyle({ margin: "10px" });
    });

    it("accepts onClick handler", () => {
      const handleClick = vi.fn();
      render(<Badge onClick={handleClick}>Clickable</Badge>);
      const badge = screen.getByText("Clickable");
      badge.click();
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("Text Content", () => {
    it("renders plain text", () => {
      render(<Badge>Plain Text</Badge>);
      expect(screen.getByText("Plain Text")).toBeInTheDocument();
    });

    it("renders numeric content", () => {
      render(<Badge>42</Badge>);
      expect(screen.getByText("42")).toBeInTheDocument();
    });

    it("renders with multiple text nodes", () => {
      render(
        <Badge>
          Text 1 Text 2
        </Badge>
      );
      expect(screen.getByText(/Text 1 Text 2/)).toBeInTheDocument();
    });

    it("renders with icon and text", () => {
      render(
        <Badge>
          <span data-testid="icon">★</span>
          <span>Star Badge</span>
        </Badge>
      );
      expect(screen.getByTestId("icon")).toBeInTheDocument();
      expect(screen.getByText("Star Badge")).toBeInTheDocument();
    });
  });

  describe("Layout", () => {
    it("uses inline-flex display", () => {
      const { container } = render(<Badge>Flex</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain("inline-flex");
    });

    it("centers items vertically", () => {
      const { container } = render(<Badge>Centered</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain("items-center");
    });

    it("applies horizontal padding", () => {
      const { container } = render(<Badge>Padded</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain("px-2");
    });

    it("applies vertical padding", () => {
      const { container } = render(<Badge>Padded</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain("py-0.5");
    });

    it("has rounded-full border radius", () => {
      const { container } = render(<Badge>Rounded</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain("rounded-full");
    });
  });
});
