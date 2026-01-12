"use client";

import { offset } from "@floating-ui/dom";
import { flip, useFloating } from "@floating-ui/react-dom";
import { safeAutoUpdate } from "@ui/util";
import clsx from "clsx";
import { motion } from "framer-motion";
import React, { ReactNode, useEffect, useState } from "react";
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
  style?: any;
}

export function StyledTooltip({
  children,
  content,
  className,
  size = "sm",
  onHide,
  style
}: StyledProps) {
  const [show, setShow] = useState(false);

  const { refs, floatingStyles } = useFloating({
    whileElementsMounted: safeAutoUpdate,
    placement: "bottom",
    middleware: [flip(), offset({ mainAxis: 4 })]
  });

  const [portalContainer, setPortalContainer] = useState<Element | null>(null);

  useEffect(() => {
    setPortalContainer(document.getElementById("popper-container"));
  }, []);

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
      style={style}
    >
      {children}
      {portalContainer &&
        createPortal(
          <div
            ref={refs.setFloating}
            className="z-[1070] absolute"
            style={{ ...floatingStyles, visibility: show && content ? "visible" : "hidden" }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.75 }}
              animate={{ opacity: show && content ? 1 : 0, scale: show && content ? 1 : 0.75 }}
              className={clsx(
                "bg-blue-powder dark:bg-dark-default max-w-[320px] text-blue-dark-sky rounded-lg ",
                size === "sm" && "p-1 text-xs font-semibold",
                size === "md" && "p-2 text-xs"
              )}
            >
              {content}
            </motion.div>
          </div>,
          portalContainer
        )}
    </div>
  );
}
