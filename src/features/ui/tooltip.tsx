"use client";

import React, { ReactNode, useState } from "react";
import { createPortal } from "react-dom";
import { usePopper } from "react-popper";
import { useMountedState } from "react-use";
import { classNameObject } from "@ui/util";
import { AnimatePresence, motion } from "framer-motion";

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
        <AnimatePresence>
          {show && (
            <motion.div
              ref={setPopperElement}
              className="z-10"
              style={{ ...popper.styles.popper, visibility: show ? "visible" : "hidden" }}
              {...popper.attributes.popper}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.75 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.75 }}
                className="bg-blue-powder dark:bg-dark-default max-w-[320px] text-blue-dark-sky p-1 rounded-lg text-xs font-semibold"
              >
                {content}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.querySelector("#popper-container") ?? document.createElement("div")
      )}
    </div>
  ) : (
    <></>
  );
}
