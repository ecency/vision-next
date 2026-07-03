"use client";

import {
  HTMLAttributes,
  HTMLProps,
  PropsWithChildren,
  ReactNode,
  useEffect,
  useMemo,
  useState
} from "react";
import { createPortal } from "react-dom";
import { useFilteredProps } from "../util";
import { useClickAway, useMountedState, useWindowSize } from "react-use";
import { PopoverSheet } from "@ui/popover/popover-sheet";
import { flip, Placement, shift } from "@floating-ui/dom";
import { useFloating } from "@floating-ui/react-dom";
import { safeAutoUpdate } from "@ui/util";
import clsx from "clsx";

interface ShowProps {
  show: boolean;
  setShow: (v: boolean) => void;
  children: ReactNode;
}

interface Props {
  directContent?: ReactNode;
  customClassName?: string;
  useMobileSheet?: boolean;
  stopPropagationForChild?: boolean;
  placement?: Placement;
  behavior?: "hover" | "click";
  // Seed the initial open state for an UNCONTROLLED popover (no `setShow`). Lets
  // a deferred-mount caller open the popover on the same interaction that
  // mounts it, while leaving the popover's own hover/click handlers fully in
  // control afterwards. Ignored when `show`/`setShow` are provided.
  defaultShow?: boolean;
}

export function Popover(
  props: (Partial<ShowProps> & Partial<Props>) & HTMLAttributes<HTMLDivElement>
) {
  const nativeProps = useFilteredProps(props, [
    "anchorParent",
    "show",
    "setShow",
    "customClassName",
    "useMobileSheet",
    "placement",
    "stopPropagationForChild",
    "behavior",
    "directContent",
    "defaultShow"
  ]);

  const { refs, floatingStyles } = useFloating({
    whileElementsMounted: safeAutoUpdate,
    middleware: [flip(), shift()],
    placement: props.placement,
    transform: true
  });

  useClickAway(refs.floating as any, () => props.behavior === "click" && show && setShow(false));

  const [show, setShow] = useState(
    (props as ShowProps).show ?? (props as Props).defaultShow ?? false
  );

  const isMounted = useMountedState();
  const windowSize = useWindowSize();

  const isSheet = useMemo(
    () => windowSize.width < 768 && (props as Props).useMobileSheet,
    [props, windowSize.width]
  );
  useEffect(() => {
    // Only sync from a CONTROLLED parent. For an uncontrolled popover
    // (props.show === undefined) this effect must not run, otherwise it would
    // reset a `defaultShow`-seeded open state back to false on mount.
    if (props.show === undefined) return;
    if (props.show !== show) setShow(props.show);
  }, [props.show]);

  useEffect(() => {
    show !== props.show && props.setShow?.(show);
  }, [show]);

  const portalContainer =
    typeof document !== "undefined"
      ? document.getElementById("popper-container") || document.body
      : null;

  return (
    <div
      ref={refs.setReference}
      {...nativeProps}
      role="presentation"
      onClick={(e) => {
        e.stopPropagation();
        // Uncontrolled popovers open on tap/click — including the mobile sheet
        // path, so a tap reliably reopens the sheet after dismissal (touch
        // browsers don't always re-fire mouseenter on an already-mounted
        // trigger). Controlled popovers (setShow provided) are driven by the parent.
        if (typeof props.setShow !== "function") setShow(true);
      }}
      onMouseEnter={() => props.behavior === "hover" && setShow(true)}
      onMouseLeave={() => props.behavior === "hover" && setShow(false)}
    >
      {props.directContent}
      {isMounted() &&
        !isSheet &&
        portalContainer &&
        createPortal(
          show ? (
            <div ref={refs.setFloating} style={floatingStyles} className="absolute z-[1110]">
              <div
                className={clsx(
                  props.customClassName ??
                    "bg-white border border-[--border-color] rounded-lg dark:bg-dark-200",
                  "animate-scale-in"
                )}
              >
                {props.children}
              </div>
            </div>
          ) : (
            <></>
          ),
          portalContainer
        )}
      {isMounted() &&
        portalContainer &&
        createPortal(
          isSheet ? (
            <PopoverSheet show={show} setShow={setShow}>
              {props.children}
            </PopoverSheet>
          ) : (
            <></>
          ),
          portalContainer
        )}
    </div>
  );
}

export function PopoverTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={className + " p-2 border-b border-[--border-color]"}>{children}</div>;
}

export function PopoverContent(props: PropsWithChildren<HTMLProps<HTMLDivElement>>) {
  return (
    <div {...props} className={clsx("p-2", props.className)}>
      {props.children}
    </div>
  );
}
