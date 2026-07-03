import React, { useContext, useSyncExternalStore } from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { motion, PresenceContext } from "framer-motion";
import { ModalSidebar } from "@ui/modal/modal-sidebar";

// Deliberately NOT mocking framer-motion: these tests cover AnimatePresence
// exit bookkeeping. In framer-motion 11 a motion component that MOUNTS inside
// an already-exiting AnimatePresence child registers with the presence context
// but can never report exit-complete (isPresent never transitions for it), so
// the sidebar is never removed — stuck on screen until a page reload
// (motiondivision/motion#3243; the notifications drawer wedged this way when a
// notification arrived over the websocket mid-close). ModalSidebar therefore
// isolates its children from the presence context; the probe test below fails
// if that isolation is ever removed. The timing-dependent wedge itself only
// reproduces in a real browser (jsdom completes exits in ~1 frame), so the
// mid-exit mount test here is a smoke test, not the primary guard.

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

// Mirrors the notifications panel: list items are animated motion components
// and the list grows from a store subscription, not from parent props (an
// exiting AnimatePresence child no longer receives parent prop updates).
function LiveItems({ store }: { store: ReturnType<typeof createStore> }) {
  const count = useSyncExternalStore(store.subscribe, store.get, store.get);
  return (
    <div data-testid="sidebar-content">
      {Array.from({ length: count }, (_, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }}>
          item-{i}
        </motion.div>
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

  it("isolates children from the modal's presence context (wedge guard)", () => {
    const seen: Array<unknown> = [];
    function Probe() {
      seen.push(useContext(PresenceContext));
      return <div data-testid="probe" />;
    }
    render(
      <ModalSidebar show={true} setShow={() => {}} placement="right">
        <Probe />
      </ModalSidebar>
    );
    expect(screen.getByTestId("probe")).toBeInTheDocument();
    // Children must NOT see the sidebar's presence context: any motion
    // component mounting mid-exit would otherwise register with it and block
    // the sidebar's removal forever.
    expect(seen.length).toBeGreaterThan(0);
    seen.forEach((ctx) => expect(ctx).toBeNull());
  });

  it("removes the sidebar from the DOM after closing (control)", async () => {
    const store = createStore(2);
    const { rerender } = render(renderSidebar(true, store));
    expect(screen.getByTestId("sidebar-content")).toBeInTheDocument();

    rerender(renderSidebar(false, store));

    await waitFor(() => expect(screen.queryByTestId("sidebar-content")).not.toBeInTheDocument(), {
      timeout: 4000
    });
  }, 10_000);

  it("removes the sidebar after closing even when animated content mounts mid-exit (smoke)", async () => {
    const store = createStore(2);
    const { rerender } = render(renderSidebar(true, store));
    expect(screen.getByTestId("sidebar-content")).toBeInTheDocument();

    // Begin closing, then a "new notification" mounts another animated item
    // while the exit animation is still running.
    rerender(renderSidebar(false, store));
    act(() => store.set(3));

    await waitFor(() => expect(screen.queryByTestId("sidebar-content")).not.toBeInTheDocument(), {
      timeout: 4000
    });
  }, 10_000);
});
