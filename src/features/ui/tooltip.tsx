"use client";

import { offset } from "@floating-ui/dom";
import { flip, useFloating } from "@floating-ui/react-dom";
import { safeAutoUpdate } from "@ui/util";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import React, { ReactNode, useState } from "react";
import { createPortal } from "react-dom";

interface Props {
  content: string | JSX.Element;
  children: JSX.Element;
}

// TODO: create styled tooltip
export function Tooltip({ content, children }: Props) {
  return React.cloneElement(children, { title: content });
}

interface StyledProps {
  children: ReactNode;
  content: ReactNode;
  className?: string;
  size?: "sm" | "md";
  onHide?: () => void;
}

export function StyledTooltip({ children, content, className, size = "sm", onHide }: StyledProps) {
  const [show, setShow] = useState(false);

  const { refs, floatingStyles } = useFloating({
    whileElementsMounted: safeAutoUpdate,
    placement: "bottom",
    middleware: [flip(), offset({ mainAxis: 4 })]
  });

  const portalContainer =
    typeof document !== "undefined"
      ? document.getElementById("popper-container") || document.body
      : null;

  return (
    <div
      ref={refs.setReference}
      className={clsx("styled-tooltip", className)}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => {
        setShow(false);
        onHide?.();
      }}
      onClick={() => {
        setShow(!show);

        if (show) {
          onHide?.();
        }
      }}
    >
      {children}
      {portalContainer &&
        createPortal(
          <AnimatePresence>
            {show && content && (
              <motion.div
                ref={refs.setFloating}
                className="z-[1070] absolute"
                style={{ ...floatingStyles, visibility: show ? "visible" : "hidden" }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.75 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.75 }}
                  className={clsx(
                    "bg-blue-powder dark:bg-dark-default max-w-[320px] text-blue-dark-sky rounded-lg ",
                    size === "sm" && "p-1 text-xs font-semibold",
                    size === "md" && "p-2 text-xs"
                  )}
                >
                  {content}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          portalContainer
        )}
    </div>
  );
}
