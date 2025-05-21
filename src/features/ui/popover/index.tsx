"use client";

import { HTMLAttributes, ReactNode, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useFilteredProps } from "../util";
import { useClickAway, useMountedState, useWindowSize } from "react-use";
import { PopoverSheet } from "@ui/popover/popover-sheet";
import { autoUpdate, flip, Placement, shift } from "@floating-ui/dom";
import { useFloating } from "@floating-ui/react-dom";
import { AnimatePresence, motion } from "framer-motion";

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
    "directContent"
  ]);

  const { refs, floatingStyles } = useFloating({
    whileElementsMounted: autoUpdate,
    middleware: [flip(), shift()],
    placement: props.placement,
    transform: true
  });

  useClickAway(refs.floating as any, () => props.behavior === "click" && show && setShow(false));

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

  return (
    <div
      ref={refs.setReference}
      {...nativeProps}
      onClick={(e) => {
        e.stopPropagation();
        typeof props.setShow === "function" || isSheet ? undefined : setShow(true);
      }}
      onMouseEnter={() => props.behavior === "hover" && setShow(true)}
      onMouseLeave={() => props.behavior === "hover" && setShow(false)}
    >
      {props.directContent}
      {isMounted() &&
        !isSheet &&
        createPortal(
          <AnimatePresence>
            {show && (
              <div ref={refs.setFloating} style={floatingStyles} className="absolute z-[1060]">
                <motion.div
                  className={
                    props.customClassName ?? "bg-white border border-[--border-color] rounded-lg"
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
