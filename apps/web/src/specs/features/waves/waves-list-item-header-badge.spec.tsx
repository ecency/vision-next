import { vi } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";

// The global @/utils mock only exposes random + getAccessToken; the component
// relies on the real appName to detect the Ecency source.
vi.mock("@/utils", async () => ({
  ...(await vi.importActual("@/utils")),
  random: vi.fn(),
  getAccessToken: vi.fn(() => "mock-token")
}));

// UserAvatar / TimeLabel come from the heavy @/features/shared barrel; stub the
// two pieces this header uses so the render stays light and deterministic. The
// Ecency badge is the real component (imported from its own light module) so
// these assertions keep exercising the shared detection logic.
vi.mock("@/features/shared", async () => ({
  UserAvatar: () => <div data-testid="avatar" />,
  TimeLabel: () => <span data-testid="time" />,
  ...(await vi.importActual("@/features/shared/ecency-source-badge"))
}));

import { WavesListItemHeader } from "@/app/waves/_components/waves-list-item-header";
import { WaveEntry } from "@/entities";

function makeEntry(app?: string): WaveEntry {
  return {
    author: "alice",
    permlink: "p",
    created: "2026-06-24T00:00:00",
    json_metadata: app ? { app } : {}
  } as unknown as WaveEntry;
}

const baseProps = {
  hasParent: false,
  pure: true,
  status: "default",
  interactable: true
} as const;

// i18next is globally mocked to echo keys, so the badge label is the raw key.
// The source badge is now an inline <svg role="img"> rather than an <img>.
const BADGE = '[role="img"][aria-label="waves.source-ecency"]';

describe("WavesListItemHeader Ecency badge", () => {
  it("renders the Ecency badge for waves published from Ecency web", () => {
    const { container } = render(
      <WavesListItemHeader entry={makeEntry("ecency/4.4.0-vision")} {...baseProps} />
    );
    expect(container.querySelector(BADGE)).not.toBeNull();
  });

  it("renders the Ecency badge for the Ecency mobile app", () => {
    const { container } = render(
      <WavesListItemHeader entry={makeEntry("ecency-mobile")} {...baseProps} />
    );
    expect(container.querySelector(BADGE)).not.toBeNull();
  });

  it("does not render the badge for non-Ecency clients", () => {
    const { container } = render(
      <WavesListItemHeader entry={makeEntry("skatehive-mobile")} {...baseProps} />
    );
    expect(container.querySelector(BADGE)).toBeNull();
  });

  it("does not render the badge when app metadata is absent", () => {
    const { container } = render(<WavesListItemHeader entry={makeEntry()} {...baseProps} />);
    expect(container.querySelector(BADGE)).toBeNull();
  });
});
