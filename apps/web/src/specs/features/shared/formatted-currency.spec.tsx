import { vi } from 'vitest';
import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { FormattedCurrency } from "@/features/shared/formatted-currency";
import { useGlobalStore } from "@/core/global-store";

vi.mock("@/core/global-store", () => ({
  useGlobalStore: vi.fn()
}));

vi.mock("@/utils", () => ({
  formattedNumber: vi.fn((value, options) => {
    const formatted = value.toFixed(options.fractionDigits ?? 2);  // Fixed: Use nullish coalescing to handle fixAt={0}
    return `${options.prefix || ""}${formatted}`;
  })
}));

describe("FormattedCurrency", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock values
    (useGlobalStore as any).mockImplementation((selector: any) => {
      const state = {
        currencyRate: 1.0,
        currencySymbol: "$"
      };
      return selector(state);
    });
  });

  test("renders formatted currency with default fixAt", () => {
    const { container } = render(<FormattedCurrency value={100} />);

    expect(container.textContent).toBe("$100.00");
  });

  test("renders formatted currency with custom fixAt", () => {
    const { container } = render(<FormattedCurrency value={100} fixAt={3} />);

    expect(container.textContent).toBe("$100.000");
  });

  test("applies currency rate conversion", () => {
    (useGlobalStore as any).mockImplementation((selector: any) => {
      const state = {
        currencyRate: 2.5,
        currencySymbol: "€"
      };
      return selector(state);
    });

    const { container } = render(<FormattedCurrency value={100} />);

    expect(container.textContent).toBe("€250.00");
  });

  test("skips currency conversion when skipConversion is true", () => {
    (useGlobalStore as any).mockImplementation((selector: any) => {
      const state = {
        currencyRate: 2.5,
        currencySymbol: "€"
      };
      return selector(state);
    });

    const { container } = render(<FormattedCurrency value={100} skipConversion={true} />);

    expect(container.textContent).toBe("€100.00");
  });

  test("handles decimal values correctly", () => {
    const { container } = render(<FormattedCurrency value={123.456} />);

    expect(container.textContent).toBe("$123.46");
  });

  test("uses different currency symbols", () => {
    (useGlobalStore as any).mockImplementation((selector: any) => {
      const state = {
        currencyRate: 1.0,
        currencySymbol: "£"
      };
      return selector(state);
    });

    const { container } = render(<FormattedCurrency value={50} />);

    expect(container.textContent).toBe("£50.00");
  });

  test("handles zero value", () => {
    const { container } = render(<FormattedCurrency value={0} />);

    expect(container.textContent).toBe("$0.00");
  });

  test("handles negative values", () => {
    const { container } = render(<FormattedCurrency value={-50} />);

    expect(container.textContent).toBe("$-50.00");
  });

  test("handles large values", () => {
    const { container } = render(<FormattedCurrency value={1000000} />);

    expect(container.textContent).toBe("$1000000.00");
  });

  test("updates when value changes", () => {
    const { container, rerender } = render(<FormattedCurrency value={100} />);

    expect(container.textContent).toBe("$100.00");

    rerender(<FormattedCurrency value={200} />);

    expect(container.textContent).toBe("$200.00");
  });

  test("respects fixAt parameter with different values", () => {
    const { container: container1 } = render(<FormattedCurrency value={100} fixAt={0} />);
    expect(container1.textContent).toBe("$100");  // Fixed: Now correctly shows 0 decimals when fixAt={0}

    const { container: container2 } = render(<FormattedCurrency value={100} fixAt={4} />);
    expect(container2.textContent).toBe("$100.0000");
  });

  test("combines skipConversion with custom fixAt", () => {
    (useGlobalStore as any).mockImplementation((selector: any) => {
      const state = {
        currencyRate: 2.5,
        currencySymbol: "€"
      };
      return selector(state);
    });

    const { container } = render(
      <FormattedCurrency value={100.123} fixAt={3} skipConversion={true} />
    );

    expect(container.textContent).toBe("€100.123");
  });
});
