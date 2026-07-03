import React, { useSyncExternalStore } from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ModalSidebar } from "@ui/modal/modal-sidebar";

// The sidebar's exit animation is a CSS transition driven by
// useMountTransition: unmount is TIMER-based, so content that keeps updating
// while the drawer closes (e.g. a notification arriving over the websocket)
// can never strand it on screen. The old AnimatePresence-based version
// wedged exactly that way (motiondivision/motion#3243) — these tests pin the
// replacement behavior.

function createStore(initial: number) {
  let count = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => count,
    set(v: number) {
      count = v;
      listeners.forEach((l) => l());
    },
    subscribe(l: () => void) {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    }
  };
}

// Mirrors the notifications panel: the list grows from a store subscription,
// not from parent props.
function LiveItems({ store }: { store: ReturnType<typeof createStore> }) {
  const count = useSyncExternalStore(store.subscribe, store.get, store.get);
  return (
    <div data-testid="sidebar-content">
      {Array.from({ length: count }, (_, i) => (
        <div key={i}>item-{i}</div>
      ))}
    </div>
  );
}

describe("ModalSidebar", () => {
  let portalRoot: HTMLElement;

  beforeEach(() => {
    portalRoot = document.createElement("div");
    portalRoot.setAttribute("id", "modal-dialog-container");
    document.body.appendChild(portalRoot);
  });

  afterEach(() => {
    document.body.removeChild(portalRoot);
    document.body.classList.remove("overflow-hidden");
  });

  const renderSidebar = (show: boolean, store: ReturnType<typeof createStore>) => (
    <ModalSidebar show={show} setShow={() => {}} placement="right">
      <LiveItems store={store} />
    </ModalSidebar>
  );

  it("slides in: renders off-screen first, then transitions to open", async () => {
    const store = createStore(2);
    render(renderSidebar(true, store));

    const surface = () => portalRoot.querySelector(".ecency-sidebar");
    expect(surface()).toBeInTheDocument();
    // First mounted frame is the closed position (enter transition start).
    expect(surface()!.className).toContain("translate-x-full");
    // Two frames later the open class lands and the CSS transition runs.
    await waitFor(() => expect(surface()!.className).toContain("translate-x-0"));
  });

  it("removes the sidebar from the DOM after closing (control)", async () => {
    const store = createStore(2);
    const { rerender } = render(renderSidebar(true, store));
    expect(screen.getByTestId("sidebar-content")).toBeInTheDocument();

    rerender(renderSidebar(false, store));

    // Exit state applies immediately; unmount follows after the 300ms timer.
    expect(portalRoot.querySelector(".ecency-sidebar")!.className).toContain("translate-x-full");
    await waitFor(() => expect(screen.queryByTestId("sidebar-content")).not.toBeInTheDocument(), {
      timeout: 2000
    });
  });

  it("removes the sidebar after closing even when content mounts mid-exit", async () => {
    const store = createStore(2);
    const { rerender } = render(renderSidebar(true, store));
    expect(screen.getByTestId("sidebar-content")).toBeInTheDocument();

    // Begin closing, then a "new notification" arrives while the exit runs.
    rerender(renderSidebar(false, store));
    act(() => store.set(3));

    await waitFor(() => expect(screen.queryByTestId("sidebar-content")).not.toBeInTheDocument(), {
      timeout: 2000
    });
  });

  it("reopening during the exit keeps it mounted and open", async () => {
    const store = createStore(1);
    const { rerender } = render(renderSidebar(true, store));
    await waitFor(() =>
      expect(portalRoot.querySelector(".ecency-sidebar")!.className).toContain("translate-x-0")
    );

    rerender(renderSidebar(false, store));
    rerender(renderSidebar(true, store));

    await waitFor(() =>
      expect(portalRoot.querySelector(".ecency-sidebar")!.className).toContain("translate-x-0")
    );
    // Well past the 300ms exit window it must still be mounted.
    await new Promise((r) => setTimeout(r, 500));
    expect(screen.getByTestId("sidebar-content")).toBeInTheDocument();
  });
});
