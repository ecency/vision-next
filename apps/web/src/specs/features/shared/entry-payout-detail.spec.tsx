import { vi } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import { EntryPayoutDetail } from "@/features/shared/entry-payout/entry-payout-detail";
import { mockEntry } from "@/specs/test-utils";

// FormattedCurrency comes from the heavy @/features/shared barrel; stub it.
vi.mock("@/features/shared", () => ({
  FormattedCurrency: ({ value, fixAt = 2 }: { value: number; fixAt?: number }) => (
    <span data-testid="formatted-currency">{`$${value.toFixed(fixAt)}`}</span>
  )
}));

// The global @/utils mock only exposes random + getAccessToken, but the
// component relies on the real parseAsset / dateToFullRelative / formattedNumber.
vi.mock("@/utils", async () => ({
  ...(await vi.importActual("@/utils")),
  random: vi.fn(),
  getAccessToken: vi.fn(() => "mock-token")
}));

vi.mock("@ecency/sdk", async () => ({
  ...(await vi.importActual("@ecency/sdk")),
  getDynamicPropsQueryOptions: vi.fn(() => ({ queryKey: ["dynamic-props"], queryFn: vi.fn() }))
}));

// Keep dynamic props deterministic and synchronous so the component renders
// without a live QueryClient.
vi.mock("@tanstack/react-query", async () => ({
  ...(await vi.importActual("@tanstack/react-query")),
  useQuery: vi.fn(() => ({ data: { base: 1, quote: 1, hbdPrintRate: 10000 } }))
}));

describe("EntryPayoutDetail", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("does not crash when entry.beneficiaries is undefined (waves feed shape)", () => {
    // Some waves-feed entries arrive without a beneficiaries array. Reading
    // `.length` on it threw "Cannot read properties of undefined" and tripped
    // the error boundary on /waves (ECENCY-NEXT-1GDH).
    const entry = mockEntry({
      pending_payout_value: "1.234 HBD",
      author_payout_value: "0.000 HBD",
      curator_payout_value: "0.000 HBD",
      max_accepted_payout: "1000000.000 HBD",
      beneficiaries: undefined
    });

    const { container } = render(<EntryPayoutDetail entry={entry} />);

    expect(container.querySelector(".payout-popover-content")).not.toBeNull();
  });

  it("renders the beneficiary breakdown when beneficiaries are present", () => {
    const entry = mockEntry({
      pending_payout_value: "1.234 HBD",
      author_payout_value: "0.000 HBD",
      curator_payout_value: "0.000 HBD",
      max_accepted_payout: "1000000.000 HBD",
      beneficiaries: [{ account: "ecency", weight: 1000 }]
    });

    const { getByText } = render(<EntryPayoutDetail entry={entry} />);

    expect(getByText(/ecency/)).toBeInTheDocument();
    expect(getByText(/10%/)).toBeInTheDocument();
  });
});
