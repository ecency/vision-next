import { vi } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";

// The global @/utils mock only exposes random + getAccessToken; the badge relies
// on the real appName to detect the Ecency source from json_metadata.app.
vi.mock("@/utils", async () => ({
  ...(await vi.importActual("@/utils")),
  random: vi.fn(),
  getAccessToken: vi.fn(() => "mock-token")
}));

import { EcencySourceBadge } from "@/features/shared/ecency-source-badge";

// i18next is globally mocked to echo keys, so the badge alt is the raw key.
const BADGE = 'img[alt="waves.source-ecency"]';

describe("EcencySourceBadge", () => {
  it("renders for the Ecency web client (ecency/x.y-vision)", () => {
    const { container } = render(<EcencySourceBadge app="ecency/4.4.0-vision" />);
    expect(container.querySelector(BADGE)).not.toBeNull();
  });

  it("renders for the Ecency mobile client", () => {
    const { container } = render(<EcencySourceBadge app="ecency-mobile" />);
    expect(container.querySelector(BADGE)).not.toBeNull();
  });

  it("accepts the object form of json_metadata.app ({ name })", () => {
    const { container } = render(<EcencySourceBadge app={{ name: "ecency/4.4.0-vision" }} />);
    expect(container.querySelector(BADGE)).not.toBeNull();
  });

  it("does not render for non-Ecency clients", () => {
    const { container } = render(<EcencySourceBadge app="skatehive-mobile" />);
    expect(container.querySelector(BADGE)).toBeNull();
  });

  it("does not render when app metadata is missing", () => {
    const { container } = render(<EcencySourceBadge app={undefined} />);
    expect(container.querySelector(BADGE)).toBeNull();
  });
});
