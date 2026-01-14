import { vi } from "vitest";
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Pagination } from "@ui/pagination";

// Mock i18next for translations
vi.mock("i18next", () => ({
  __esModule: true,
  default: {
    t: vi.fn((key) => {
      const translations: Record<string, string> = {
        "g.first": "First",
        "g.last": "Last"
      };
      return translations[key] || key;
    })
  }
}));

// Mock useIsMobile hook
vi.mock("@/features/ui/util/use-is-mobile", () => ({
  useIsMobile: vi.fn(() => false)
}));

describe("Pagination", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("renders pagination component", () => {
      render(<Pagination dataLength={100} pageSize={10} onPageChange={vi.fn()} />);
      expect(screen.getByText("First")).toBeInTheDocument();
      expect(screen.getByText("Last")).toBeInTheDocument();
    });

    it("renders page numbers", () => {
      render(<Pagination dataLength={30} pageSize={10} onPageChange={vi.fn()} />);
      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
    });

    it("calculates correct number of pages", () => {
      render(<Pagination dataLength={50} pageSize={10} onPageChange={vi.fn()} />);
      expect(screen.getByText("5")).toBeInTheDocument();
    });

    it("renders with custom className", () => {
      const { container } = render(
        <Pagination dataLength={30} pageSize={10} onPageChange={vi.fn()} className="custom-pagination" />
      );
      expect(container.querySelector(".custom-pagination")).toBeInTheDocument();
    });
  });

  describe("Page Navigation", () => {
    it("calls onPageChange when clicking a page number", () => {
      const handlePageChange = vi.fn();
      render(<Pagination dataLength={30} pageSize={10} onPageChange={handlePageChange} />);
      fireEvent.click(screen.getByText("2"));
      expect(handlePageChange).toHaveBeenCalledWith(2);
    });

    it("calls onPageChange when clicking First button", () => {
      const handlePageChange = vi.fn();
      render(<Pagination dataLength={50} pageSize={10} page={3} onPageChange={handlePageChange} />);
      fireEvent.click(screen.getByText("First"));
      expect(handlePageChange).toHaveBeenCalledWith(1);
    });

    it("calls onPageChange when clicking Last button", () => {
      const handlePageChange = vi.fn();
      render(<Pagination dataLength={50} pageSize={10} onPageChange={handlePageChange} />);
      fireEvent.click(screen.getByText("Last"));
      expect(handlePageChange).toHaveBeenCalledWith(5);
    });

    it("calls onPageChange when clicking next arrow", () => {
      const handlePageChange = vi.fn();
      render(<Pagination dataLength={50} pageSize={10} page={2} onPageChange={handlePageChange} />);
      const buttons = screen.getAllByRole("button");
      // Next button is before the Last button
      const nextButton = buttons[buttons.length - 2];
      fireEvent.click(nextButton);
      expect(handlePageChange).toHaveBeenCalledWith(3);
    });

    it("calls onPageChange when clicking previous arrow", () => {
      const handlePageChange = vi.fn();
      render(<Pagination dataLength={50} pageSize={10} page={2} onPageChange={handlePageChange} />);
      const buttons = screen.getAllByRole("button");
      // Previous button is after the First button
      const prevButton = buttons[1];
      fireEvent.click(prevButton);
      expect(handlePageChange).toHaveBeenCalledWith(1);
    });
  });

  describe("Active Page State", () => {
    it("highlights first page by default", () => {
      render(<Pagination dataLength={30} pageSize={10} onPageChange={vi.fn()} />);
      const pageOne = screen.getByText("1").closest("button");
      expect(pageOne?.className).toContain("bg-blue-dark-sky");
      expect(pageOne?.className).toContain("text-white");
    });

    it("highlights correct page when page prop is provided", () => {
      render(<Pagination dataLength={50} pageSize={10} page={3} onPageChange={vi.fn()} />);
      const pageThree = screen.getByText("3").closest("button");
      expect(pageThree?.className).toContain("bg-blue-dark-sky");
    });

    it("updates active page on page change", () => {
      const { rerender } = render(
        <Pagination dataLength={30} pageSize={10} page={1} onPageChange={vi.fn()} />
      );
      let pageOne = screen.getByText("1").closest("button");
      expect(pageOne?.className).toContain("bg-blue-dark-sky");

      rerender(<Pagination dataLength={30} pageSize={10} page={2} onPageChange={vi.fn()} />);
      const pageTwo = screen.getByText("2").closest("button");
      expect(pageTwo?.className).toContain("bg-blue-dark-sky");
    });
  });

  describe("Button States", () => {
    it("disables First button on first page", () => {
      render(<Pagination dataLength={50} pageSize={10} page={1} onPageChange={vi.fn()} />);
      const firstButton = screen.getByText("First").closest("button");
      expect(firstButton).toBeDisabled();
    });

    it("enables First button on pages after first", () => {
      render(<Pagination dataLength={50} pageSize={10} page={2} onPageChange={vi.fn()} />);
      const firstButton = screen.getByText("First").closest("button");
      expect(firstButton).not.toBeDisabled();
    });

    it("disables Last button on last page", () => {
      render(<Pagination dataLength={50} pageSize={10} page={5} onPageChange={vi.fn()} />);
      const lastButton = screen.getByText("Last").closest("button");
      expect(lastButton).toBeDisabled();
    });

    it("enables Last button on pages before last", () => {
      render(<Pagination dataLength={50} pageSize={10} page={4} onPageChange={vi.fn()} />);
      const lastButton = screen.getByText("Last").closest("button");
      expect(lastButton).not.toBeDisabled();
    });

    it("disables previous button on first page", () => {
      render(<Pagination dataLength={50} pageSize={10} page={1} onPageChange={vi.fn()} />);
      const buttons = screen.getAllByRole("button");
      const prevButton = buttons[1]; // Second button is previous
      expect(prevButton).toBeDisabled();
    });

    it("disables next button on last page", () => {
      render(<Pagination dataLength={50} pageSize={10} page={5} onPageChange={vi.fn()} />);
      const buttons = screen.getAllByRole("button");
      const nextButton = buttons[buttons.length - 2]; // Second to last is next
      expect(nextButton).toBeDisabled();
    });
  });

  describe("ShowLastNo Prop", () => {
    it("shows Last button by default", () => {
      render(<Pagination dataLength={50} pageSize={10} onPageChange={vi.fn()} />);
      expect(screen.getByText("Last")).toBeInTheDocument();
    });

    it("shows Last button when showLastNo is true", () => {
      render(<Pagination dataLength={50} pageSize={10} onPageChange={vi.fn()} showLastNo={true} />);
      expect(screen.getByText("Last")).toBeInTheDocument();
    });

    it("hides Last button when showLastNo is false", () => {
      render(<Pagination dataLength={50} pageSize={10} onPageChange={vi.fn()} showLastNo={false} />);
      expect(screen.queryByText("Last")).not.toBeInTheDocument();
    });
  });

  describe("Page Size Calculations", () => {
    it("handles exact division of pages", () => {
      render(<Pagination dataLength={40} pageSize={10} onPageChange={vi.fn()} />);
      expect(screen.getByText("4")).toBeInTheDocument();
      expect(screen.queryByText("5")).not.toBeInTheDocument();
    });

    it("handles remainder with ceiling", () => {
      render(<Pagination dataLength={45} pageSize={10} onPageChange={vi.fn()} />);
      expect(screen.getByText("5")).toBeInTheDocument();
    });

    it("handles single page", () => {
      render(<Pagination dataLength={5} pageSize={10} onPageChange={vi.fn()} />);
      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.queryByText("2")).not.toBeInTheDocument();
    });

    it("handles large datasets", () => {
      render(<Pagination dataLength={1000} pageSize={10} onPageChange={vi.fn()} />);
      // Should render but only show limited page numbers
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThan(4); // At least First, Prev, some pages, Next, Last
    });
  });

  describe("Styling", () => {
    it("applies border styling to buttons", () => {
      render(<Pagination dataLength={30} pageSize={10} onPageChange={vi.fn()} />);
      const button = screen.getByText("1").closest("button");
      expect(button?.className).toContain("border");
    });

    it("applies rounded corners to first button", () => {
      render(<Pagination dataLength={30} pageSize={10} onPageChange={vi.fn()} />);
      const firstButton = screen.getByText("First").closest("button");
      expect(firstButton?.className).toContain("rounded-l-xl");
    });

    it("applies rounded corners to last button", () => {
      render(<Pagination dataLength={30} pageSize={10} onPageChange={vi.fn()} />);
      const lastButton = screen.getByText("Last").closest("button");
      expect(lastButton?.className).toContain("rounded-r-xl");
    });

    it("applies hover effects to non-active pages", () => {
      render(<Pagination dataLength={30} pageSize={10} page={1} onPageChange={vi.fn()} />);
      const pageTwo = screen.getByText("2").closest("button");
      expect(pageTwo?.className).toContain("hover:bg-gray-100");
    });
  });

  describe("Dark Mode", () => {
    it("applies dark mode border colors", () => {
      render(<Pagination dataLength={30} pageSize={10} onPageChange={vi.fn()} />);
      const button = screen.getByText("1").closest("button");
      expect(button?.className).toContain("dark:");
    });

    it("applies dark mode hover effects", () => {
      render(<Pagination dataLength={30} pageSize={10} page={1} onPageChange={vi.fn()} />);
      const pageTwo = screen.getByText("2").closest("button");
      expect(pageTwo?.className).toContain("dark:hover:bg-gray-800");
    });
  });

  describe("Edge Cases", () => {
    it("handles zero items", () => {
      render(<Pagination dataLength={0} pageSize={10} onPageChange={vi.fn()} />);
      expect(screen.queryByText("1")).not.toBeInTheDocument();
    });

    it("handles very small page size", () => {
      render(<Pagination dataLength={10} pageSize={1} onPageChange={vi.fn()} />);
      expect(screen.getByText("1")).toBeInTheDocument();
    });

    it("handles page prop beyond total pages", () => {
      render(<Pagination dataLength={20} pageSize={10} page={10} onPageChange={vi.fn()} />);
      // Component should handle gracefully
      expect(screen.getByText("First")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("renders all buttons as button elements", () => {
      render(<Pagination dataLength={50} pageSize={10} onPageChange={vi.fn()} />);
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThan(0);
    });

    it("disabled buttons have proper disabled attribute", () => {
      render(<Pagination dataLength={50} pageSize={10} page={1} onPageChange={vi.fn()} />);
      const firstButton = screen.getByText("First").closest("button");
      expect(firstButton).toHaveAttribute("disabled");
    });

    it("buttons are keyboard accessible", () => {
      const handlePageChange = vi.fn();
      render(<Pagination dataLength={30} pageSize={10} onPageChange={handlePageChange} />);
      const pageTwo = screen.getByText("2");
      pageTwo.focus();
      expect(document.activeElement).toBe(pageTwo);
    });
  });
});
