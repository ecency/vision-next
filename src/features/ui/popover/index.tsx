"use client";

import { HTMLAttributes, ReactNode, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useFilteredProps } from "../util";
import { useClickAway, useMountedState, useWindowSize } from "react-use";
import { PopoverSheet } from "@ui/popover/popover-sheet";
import { autoUpdate, flip, Placement } from "@floating-ui/dom";
import { useFloating } from "@floating-ui/react-dom";
import { AnimatePresence, motion } from "framer-motion";

interface ShowProps {
  show: boolean;
  setShow: (v: boolean) => void;
  children: ReactNode;
  stopPropagationForChild?: boolean;
  placement?: Placement;
}

interface Props {
  children: ReactNode;
  anchorParent?: boolean; // TODO add support
  customClassName?: string;
  useMobileSheet?: boolean;
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
    "stopPropagationForChild"
  ]);

  const { refs, floatingStyles } = useFloating({
    whileElementsMounted: autoUpdate,
    middleware: [flip()],
    placement: props.placement
  });

  useClickAway(refs.floating as any, () => show && setShow(false));

  const [show, setShow] = useState((props as ShowProps).show ?? false);

  const isMounted = useMountedState();
  const windowSize = useWindowSize();

  const isSheet = useMemo(
    () => windowSize.width < 768 && (props as Props).useMobileSheet,
    [props, windowSize.width]
  );
  useEffect(() => {
    props.show !== show && setShow((props as ShowProps).show ?? false);
  }, [props.show]);

  useEffect(() => {
    show !== props.show && props.setShow?.(show);
  }, [show]);

  // useEffect(() => {
  //   if ((props as Props).anchorParent && host) {
  //     host.parentElement.addEventListener("click", () => setShow(true));
  //     host.parentElement.addEventListener("mouseenter", () => setShow(true));
  //     host.parentElement.addEventListener("mouseleave", () => setShow(false));
  //   }
  // }, [host, props]);

  return (
    <div
      ref={refs.setReference}
      {...nativeProps}
      // onMouseLeave={(e) => props.stopPropagationForChild && setShow(false)}
    >
      {isMounted() &&
        !isSheet &&
        createPortal(
          <AnimatePresence>
            {show && (
              <div ref={refs.setFloating} style={floatingStyles} className="absolute">
                <motion.div
                  className={
                    props.customClassName ?? "bg-white border border-[--border-color] rounded-xl"
                  }
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  {props.children}
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.querySelector("#popper-container") ?? document.createElement("div")
        )}
      {isMounted() &&
        createPortal(
          isSheet ? (
            <PopoverSheet show={show} setShow={setShow}>
              {props.children}
            </PopoverSheet>
          ) : (
            <></>
          ),
          document.querySelector("#popper-container")!!
        )}
    </div>
  );
}

export function PopoverTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={className + " p-2 border-b border-[--border-color]"}>{children}</div>;
}

export function PopoverContent({ children }: { children: ReactNode }) {
  return <div className="p-2">{children}</div>;
}
