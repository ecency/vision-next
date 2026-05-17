import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

// Mock framer-motion so the confirm Modal renders synchronously in jsdom
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, onClick, className, ...props }: any) => (
      // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
      <div onClick={onClick} className={className} {...props}>
        {children}
      </div>
    )
  },
  AnimatePresence: ({ children }: any) => <>{children}</>
}));

const { mutateAsync } = vi.hoisted(() => ({
  mutateAsync: vi.fn().mockResolvedValue(undefined)
}));

vi.mock("@/api/sdk-mutations", () => ({
  useWitnessProxyMutation: () => ({ mutateAsync, isPending: false })
}));

import { ProfileWalletHpGovernancePromo } from "@/app/(dynamicPages)/profile/[username]/wallet/(token)/_components/profile-wallet-hp-governance-promo";

const K = "profile-wallet.hp-governance-promo";

describe("ProfileWalletHpGovernancePromo", () => {
  let portalRoot: HTMLElement;
  let feedback: any[];
  const onFeedback = (e: Event) =>
    feedback.push((e as CustomEvent).detail);

  beforeEach(() => {
    mutateAsync.mockClear();
    feedback = [];
    window.addEventListener("ecency-feedback", onFeedback);
    portalRoot = document.createElement("div");
    portalRoot.setAttribute("id", "modal-dialog-container");
    document.body.appendChild(portalRoot);
  });

  afterEach(() => {
    window.removeEventListener("ecency-feedback", onFeedback);
    document.body.innerHTML = "";
  });

  it("opens a confirm dialog before setting the proxy", () => {
    render(<ProfileWalletHpGovernancePromo onDismiss={vi.fn()} />);

    expect(screen.getByText(`${K}.title`)).toBeInTheDocument();
    expect(screen.queryByText(`${K}.confirm-title`)).not.toBeInTheDocument();

    fireEvent.click(screen.getByText(`${K}.button`));

    expect(screen.getByText(`${K}.confirm-title`)).toBeInTheDocument();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it("sets @ecency as proxy on confirm and reports success", async () => {
    const onProxySet = vi.fn();
    render(<ProfileWalletHpGovernancePromo onProxySet={onProxySet} />);

    fireEvent.click(screen.getByText(`${K}.button`));
    fireEvent.click(screen.getByText(`${K}.confirm-ok`));

    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith({ proxy: "ecency" })
    );
    await waitFor(() => expect(onProxySet).toHaveBeenCalled());
    expect(feedback.some((f) => f.type === "success")).toBe(true);
  });

  it("invokes onDismiss without broadcasting", () => {
    const onDismiss = vi.fn();
    render(<ProfileWalletHpGovernancePromo onDismiss={onDismiss} />);

    fireEvent.click(screen.getByText(`${K}.dismiss`));

    expect(onDismiss).toHaveBeenCalled();
    expect(mutateAsync).not.toHaveBeenCalled();
  });
});
