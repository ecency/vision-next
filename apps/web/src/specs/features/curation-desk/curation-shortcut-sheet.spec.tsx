import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const config = vi.hoisted(() => ({ points: true }));
vi.mock("@/config", () => ({
  EcencyConfigManager: {
    get CONFIG() {
      return { visionFeatures: { points: { enabled: config.points } } };
    },
  },
}));
vi.mock("@ui/modal", () => ({
  Modal: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ModalHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ModalTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  ModalBody: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ModalFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import { ShortcutSheet } from "@/features/curation-desk/curation-action-dialogs";

describe("ShortcutSheet", () => {
  it("names what the p key sends the way the button does: Points here, a tip elsewhere", () => {
    config.points = true;
    const { unmount } = render(<ShortcutSheet onHide={() => undefined} />);
    expect(screen.getByText("curation-desk.shortcuts.tip-points")).toBeInTheDocument();
    expect(screen.getByText("curation-desk.shortcuts.comment")).toBeInTheDocument();
    unmount();

    config.points = false;
    render(<ShortcutSheet onHide={() => undefined} />);
    expect(screen.getByText("curation-desk.shortcuts.tip")).toBeInTheDocument();
    expect(screen.queryByText("curation-desk.shortcuts.tip-points")).toBeNull();
  });
});
