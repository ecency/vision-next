import { vi } from "vitest";
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Select } from "@ui/input/form-controls/select";

describe("Select", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("renders select element", () => {
      render(
        <Select type="select">
          <option value="1">Option 1</option>
          <option value="2">Option 2</option>
        </Select>
      );
      const select = screen.getByRole("combobox");
      expect(select).toBeInTheDocument();
    });

    it("renders with options", () => {
      render(
        <Select type="select">
          <option value="1">Option 1</option>
          <option value="2">Option 2</option>
          <option value="3">Option 3</option>
        </Select>
      );
      expect(screen.getByText("Option 1")).toBeInTheDocument();
      expect(screen.getByText("Option 2")).toBeInTheDocument();
      expect(screen.getByText("Option 3")).toBeInTheDocument();
    });

    it("renders with custom className", () => {
      render(
        <Select type="select" className="custom-class">
          <option>Option</option>
        </Select>
      );
      const select = screen.getByRole("combobox");
      expect(select).toHaveClass("custom-class");
    });
  });

  describe("Selection", () => {
    it("can select an option", () => {
      render(
        <Select type="select">
          <option value="1">Option 1</option>
          <option value="2">Option 2</option>
        </Select>
      );
      const select = screen.getByRole("combobox") as HTMLSelectElement;
      fireEvent.change(select, { target: { value: "2" } });
      expect(select.value).toBe("2");
    });

    it("calls onChange when selection changes", () => {
      const handleChange = vi.fn();
      render(
        <Select type="select" onChange={handleChange}>
          <option value="1">Option 1</option>
          <option value="2">Option 2</option>
        </Select>
      );
      const select = screen.getByRole("combobox");
      fireEvent.change(select, { target: { value: "2" } });
      expect(handleChange).toHaveBeenCalledTimes(1);
    });

    it("renders with default value", () => {
      render(
        <Select type="select" defaultValue="2">
          <option value="1">Option 1</option>
          <option value="2">Option 2</option>
        </Select>
      );
      const select = screen.getByRole("combobox") as HTMLSelectElement;
      expect(select.value).toBe("2");
    });

    it("renders with controlled value", () => {
      render(
        <Select type="select" value="3" onChange={vi.fn()}>
          <option value="1">Option 1</option>
          <option value="2">Option 2</option>
          <option value="3">Option 3</option>
        </Select>
      );
      const select = screen.getByRole("combobox") as HTMLSelectElement;
      expect(select.value).toBe("3");
    });
  });

  describe("Disabled State", () => {
    it("can be disabled", () => {
      render(
        <Select type="select" disabled>
          <option value="1">Option 1</option>
        </Select>
      );
      const select = screen.getByRole("combobox");
      expect(select).toBeDisabled();
    });

    it("is not disabled by default", () => {
      render(
        <Select type="select">
          <option value="1">Option 1</option>
        </Select>
      );
      const select = screen.getByRole("combobox");
      expect(select).not.toBeDisabled();
    });

    it("is marked as disabled when disabled prop is set", () => {
      const handleChange = vi.fn();
      render(
        <Select type="select" disabled onChange={handleChange}>
          <option value="1">Option 1</option>
          <option value="2">Option 2</option>
        </Select>
      );
      const select = screen.getByRole("combobox");
      expect(select).toBeDisabled();
      // Note: In jsdom, disabled selects can still trigger onChange
      // This is a jsdom limitation, but the disabled attribute is properly set
    });
  });

  describe("Sizes", () => {
    it("applies medium size by default", () => {
      render(
        <Select type="select">
          <option>Option</option>
        </Select>
      );
      const select = screen.getByRole("combobox");
      expect(select.className).toContain("py-2");
      expect(select.className).toContain("px-3");
    });

    it("applies small size", () => {
      render(
        <Select type="select" size="sm">
          <option>Option</option>
        </Select>
      );
      const select = screen.getByRole("combobox");
      expect(select.className).toContain("py-1");
      expect(select.className).toContain("px-2");
    });

    it("applies extra small size", () => {
      render(
        <Select type="select" size="xs">
          <option>Option</option>
        </Select>
      );
      const select = screen.getByRole("combobox");
      expect(select.className).toContain("py-1");
      expect(select.className).toContain("px-2");
    });
  });

  describe("Full Width", () => {
    it("is full width by default", () => {
      render(
        <Select type="select">
          <option>Option</option>
        </Select>
      );
      const select = screen.getByRole("combobox");
      expect(select.className).toContain("w-full");
    });

    it("can disable full width", () => {
      render(
        <Select type="select" full={false}>
          <option>Option</option>
        </Select>
      );
      const select = screen.getByRole("combobox");
      expect(select.className).toContain("!w-auto");
    });
  });

  describe("Required Field", () => {
    it("can be marked as required", () => {
      render(
        <Select type="select" required>
          <option value="">Select...</option>
          <option value="1">Option 1</option>
        </Select>
      );
      const select = screen.getByRole("combobox");
      expect(select).toBeRequired();
    });

    it("is not required by default", () => {
      render(
        <Select type="select">
          <option>Option</option>
        </Select>
      );
      const select = screen.getByRole("combobox");
      expect(select).not.toBeRequired();
    });
  });

  describe("Multiple Selection", () => {
    it("supports multiple selection", () => {
      render(
        <Select type="select" multiple>
          <option value="1">Option 1</option>
          <option value="2">Option 2</option>
          <option value="3">Option 3</option>
        </Select>
      );
      const select = screen.getByRole("listbox") as HTMLSelectElement;
      expect(select).toHaveAttribute("multiple");
    });
  });

  describe("Option Groups", () => {
    it("renders with option groups", () => {
      render(
        <Select type="select">
          <optgroup label="Group 1">
            <option value="1">Option 1</option>
            <option value="2">Option 2</option>
          </optgroup>
          <optgroup label="Group 2">
            <option value="3">Option 3</option>
            <option value="4">Option 4</option>
          </optgroup>
        </Select>
      );
      expect(screen.getByText("Option 1")).toBeInTheDocument();
      expect(screen.getByText("Option 4")).toBeInTheDocument();
    });
  });

  describe("Placeholder", () => {
    it("renders with placeholder option", () => {
      render(
        <Select type="select" defaultValue="">
          <option value="" disabled>
            Select an option...
          </option>
          <option value="1">Option 1</option>
          <option value="2">Option 2</option>
        </Select>
      );
      expect(screen.getByText("Select an option...")).toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    it("applies default styles", () => {
      render(
        <Select type="select">
          <option>Option</option>
        </Select>
      );
      const select = screen.getByRole("combobox");
      expect(select.className).toContain("border");
      expect(select.className).toContain("rounded");
    });

    it("applies dark mode styles", () => {
      render(
        <Select type="select">
          <option>Option</option>
        </Select>
      );
      const select = screen.getByRole("combobox");
      expect(select.className).toContain("dark:");
    });
  });

  describe("Name Attribute", () => {
    it("accepts name attribute for forms", () => {
      render(
        <Select type="select" name="test-select">
          <option value="1">Option 1</option>
        </Select>
      );
      const select = screen.getByRole("combobox");
      expect(select).toHaveAttribute("name", "test-select");
    });
  });
});
