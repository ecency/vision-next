"use client";

import React, { ReactNode, useState } from "react";
import { createPortal } from "react-dom";
import { usePopper } from "react-popper";
import { useMountedState } from "react-use";
import { classNameObject } from "@ui/util";

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
}

export function StyledTooltip({ children, content, className }: StyledProps) {
  const [ref, setRef] = useState<any>();
  const [popperElement, setPopperElement] = useState<any>();
  const [show, setShow] = useState(false);

  const isMounted = useMountedState();

  const popper = usePopper(ref, popperElement);

  return isMounted() ? (
    <div
      ref={setRef}
      className={classNameObject({
        "styled-tooltip": true,
        [className ?? ""]: true
      })}
      onMouseEnter={() => {
        setShow(true);
        popper.update?.();
      }}
      onMouseLeave={() => {
        setShow(false);
        popper.update?.();
      }}
      onClick={() => {
        setShow(!show);
        popper.update?.();
      }}
    >
      {children}
      {createPortal(
        <div
          className={
            "bg-blue-powder dark:bg-dark-200 z-10 p-3 rounded-lg duration-300 text-sm " +
            (show ? "opacity-100" : "opacity-0")
          }
          ref={setPopperElement}
          style={{ ...popper.styles.popper, visibility: show ? "visible" : "hidden" }}
          {...popper.attributes.popper}
        >
          {content}
        </div>,
        document.querySelector("#popper-container") ?? document.createElement("div")
      )}
    </div>
  ) : (
    <></>
  );
}
