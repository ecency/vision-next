"use client";

import { offset } from "@floating-ui/dom";
import { flip, useFloating } from "@floating-ui/react-dom";
import { safeAutoUpdate } from "@ui/util";
import clsx from "clsx";
import React, { JSX, ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface Props {
  content: string | JSX.Element;
  children: JSX.Element;
}

// TODO: create styled tooltip
export function Tooltip({ content, children }: Props) {
  const childProps = (children.props ?? {}) as Record<string, unknown>;
  const hasOwnLabel =
    typeof childProps["aria-label"] === "string" ||
    typeof childProps["aria-labelledby"] === "string";

  const next: Record<string, unknown> = { title: content };
  if (!hasOwnLabel && typeof content === "string") {
    next["aria-label"] = content;
  }

  return React.cloneElement(children, next);
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
      role="presentation"
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
            <div
              className={clsx(
                "bg-blue-powder dark:bg-dark-default max-w-[320px] text-blue-dark-sky rounded-lg ",
                "transition-[opacity,transform] duration-100 origin-top",
                show && content ? "opacity-100 scale-100" : "opacity-0 scale-75",
                size === "sm" && "p-1 text-xs font-semibold",
                size === "md" && "p-2 text-xs"
              )}
            >
              {content}
            </div>
          </div>,
          portalContainer
        )}
    </div>
  );
}
