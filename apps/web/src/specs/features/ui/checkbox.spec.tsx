import { vi } from "vitest";
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Checkbox } from "@ui/input/form-controls/checkbox";

describe("Checkbox", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("renders checkbox component", () => {
      render(<Checkbox type="checkbox" checked={false} onChange={vi.fn()} />);
      const checkbox = document.querySelector(".ecency-checkbox");
      expect(checkbox).toBeInTheDocument();
    });

    it("renders with label", () => {
      render(<Checkbox type="checkbox" checked={false} onChange={vi.fn()} label="Accept terms" />);
      expect(screen.getByText("Accept terms")).toBeInTheDocument();
    });

    it("renders without label", () => {
      render(<Checkbox type="checkbox" checked={false} onChange={vi.fn()} />);
      const checkbox = document.querySelector(".ecency-checkbox");
      expect(checkbox).toBeInTheDocument();
    });
  });

  describe("Checked State", () => {
    it("renders unchecked state", () => {
      render(<Checkbox type="checkbox" checked={false} onChange={vi.fn()} />);
      const checkIcon = document.querySelector("svg");
      expect(checkIcon).not.toBeInTheDocument();
    });

    it("renders checked state with check icon", () => {
      render(<Checkbox type="checkbox" checked={true} onChange={vi.fn()} />);
      const checkIcon = document.querySelector("svg");
      expect(checkIcon).toBeInTheDocument();
    });

    it("displays check mark when checked", () => {
      render(<Checkbox type="checkbox" checked={true} onChange={vi.fn()} />);
      const checkIcon = document.querySelector(".w-3\\.5");
      expect(checkIcon).toBeInTheDocument();
    });
  });

  describe("Interactions", () => {
    it("calls onChange with true when clicking unchecked checkbox", () => {
      const handleChange = vi.fn();
      render(<Checkbox type="checkbox" checked={false} onChange={handleChange} />);
      const checkbox = document.querySelector(".ecency-checkbox");
      if (checkbox) {
        fireEvent.click(checkbox);
      }
      expect(handleChange).toHaveBeenCalledWith(true);
    });

    it("calls onChange with false when clicking checked checkbox", () => {
      const handleChange = vi.fn();
      render(<Checkbox type="checkbox" checked={true} onChange={handleChange} />);
      const checkbox = document.querySelector(".ecency-checkbox");
      if (checkbox) {
        fireEvent.click(checkbox);
      }
      expect(handleChange).toHaveBeenCalledWith(false);
    });

    it("calls onChange only once per click", () => {
      const handleChange = vi.fn();
      render(<Checkbox type="checkbox" checked={false} onChange={handleChange} />);
      const checkbox = document.querySelector(".ecency-checkbox");
      if (checkbox) {
        fireEvent.click(checkbox);
      }
      expect(handleChange).toHaveBeenCalledTimes(1);
    });

    it("can be toggled multiple times", () => {
      const handleChange = vi.fn();
      const { rerender } = render(
        <Checkbox type="checkbox" checked={false} onChange={handleChange} />
      );
      const checkbox = document.querySelector(".ecency-checkbox");

      if (checkbox) {
        fireEvent.click(checkbox);
        expect(handleChange).toHaveBeenCalledWith(true);

        rerender(<Checkbox type="checkbox" checked={true} onChange={handleChange} />);
        fireEvent.click(checkbox);
        expect(handleChange).toHaveBeenCalledWith(false);
      }
    });
  });

  describe("Disabled State", () => {
    it("applies disabled styling when disabled", () => {
      render(<Checkbox type="checkbox" checked={false} onChange={vi.fn()} disabled />);
      const checkboxContainer = document.querySelector(".opacity-50");
      expect(checkboxContainer).toBeInTheDocument();
    });

    it("does not apply disabled styling by default", () => {
      render(<Checkbox type="checkbox" checked={false} onChange={vi.fn()} />);
      const checkbox = document.querySelector(".ecency-checkbox");
      expect(checkbox?.className).not.toContain("opacity-50");
    });

    it("still calls onChange when disabled (custom checkbox behavior)", () => {
      const handleChange = vi.fn();
      render(<Checkbox type="checkbox" checked={false} onChange={handleChange} disabled />);
      const checkbox = document.querySelector(".ecency-checkbox");
      if (checkbox) {
        fireEvent.click(checkbox);
      }
      // Custom checkbox still allows clicking when disabled (unlike native checkbox)
      expect(handleChange).toHaveBeenCalled();
    });

    it("removes hover effect when disabled", () => {
      render(<Checkbox type="checkbox" checked={false} onChange={vi.fn()} disabled />);
      const checkboxBorder = document.querySelector(".border-2");
      expect(checkboxBorder?.className).not.toContain("hover:border-gray-400");
    });
  });

  describe("Label Interactions", () => {
    it("triggers onChange when clicking label", () => {
      const handleChange = vi.fn();
      render(<Checkbox type="checkbox" checked={false} onChange={handleChange} label="Click me" />);
      const label = screen.getByText("Click me");
      fireEvent.click(label);
      expect(handleChange).toHaveBeenCalledWith(true);
    });

    it("label is part of the clickable area", () => {
      const handleChange = vi.fn();
      render(<Checkbox type="checkbox" checked={false} onChange={handleChange} label="Test Label" />);
      const checkbox = document.querySelector(".ecency-checkbox");
      const label = screen.getByText("Test Label");
      expect(checkbox).toContainElement(label);
    });
  });

  describe("Styling", () => {
    it("applies cursor-pointer class", () => {
      render(<Checkbox type="checkbox" checked={false} onChange={vi.fn()} />);
      const checkbox = document.querySelector(".cursor-pointer");
      expect(checkbox).toBeInTheDocument();
    });

    it("applies flex layout classes", () => {
      render(<Checkbox type="checkbox" checked={false} onChange={vi.fn()} />);
      const checkbox = document.querySelector(".flex.items-center.justify-center");
      expect(checkbox).toBeInTheDocument();
    });

    it("checkbox box has border and rounded corners", () => {
      render(<Checkbox type="checkbox" checked={false} onChange={vi.fn()} />);
      const checkboxBox = document.querySelector(".border-2.rounded-md");
      expect(checkboxBox).toBeInTheDocument();
    });

    it("checkbox box has correct dimensions", () => {
      render(<Checkbox type="checkbox" checked={false} onChange={vi.fn()} />);
      const checkboxBox = document.querySelector(".w-\\[1\\.25rem\\].h-\\[1\\.25rem\\]");
      expect(checkboxBox).toBeInTheDocument();
    });
  });

  describe("Dark Mode", () => {
    it("applies dark mode border color", () => {
      render(<Checkbox type="checkbox" checked={false} onChange={vi.fn()} />);
      const checkboxBox = document.querySelector(".dark\\:border-gray-600");
      expect(checkboxBox).toBeInTheDocument();
    });

    it("applies dark mode text color to check icon", () => {
      render(<Checkbox type="checkbox" checked={true} onChange={vi.fn()} />);
      const checkIcon = document.querySelector(".dark\\:text-gray-400");
      expect(checkIcon).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("entire component is clickable", () => {
      const handleChange = vi.fn();
      render(<Checkbox type="checkbox" checked={false} onChange={handleChange} label="Test" />);
      const checkbox = document.querySelector(".ecency-checkbox");
      expect(checkbox).toHaveClass("cursor-pointer");
    });

    it("provides visual feedback for checked state", () => {
      const { rerender } = render(<Checkbox type="checkbox" checked={false} onChange={vi.fn()} />);
      expect(document.querySelector("svg")).not.toBeInTheDocument();

      rerender(<Checkbox type="checkbox" checked={true} onChange={vi.fn()} />);
      expect(document.querySelector("svg")).toBeInTheDocument();
    });
  });

  describe("Toggle Variant", () => {
    it("accepts isToggle prop (handled by FormControl wrapper)", () => {
      render(<Checkbox type="checkbox" checked={false} onChange={vi.fn()} isToggle />);
      const checkbox = document.querySelector(".ecency-checkbox");
      expect(checkbox).toBeInTheDocument();
    });
  });
});
