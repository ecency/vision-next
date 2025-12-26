"use client";

import { classNameObject, useFilteredProps } from "@ui/util";
import { AnimatePresence, motion } from "framer-motion";
import { HTMLProps, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useMount, useUnmount } from "react-use";
import useMountedState from "react-use/lib/useMountedState";
import { ModalContext } from "./modal-context";

interface Props {
  show: boolean;
  onHide: () => void;
  centered?: boolean;
  animation?: boolean;
  size?: "md" | "lg" | "sm";
  dialogClassName?: string;
  overlayClassName?: string;
  raw?: boolean;
}

export function Modal(props: Omit<HTMLProps<HTMLDivElement>, "size"> & Props) {
  const [show, setShow] = useState<boolean>();

  const nativeProps = useFilteredProps(props, [
    "size",
    "animation",
    "show",
    "onHide",
    "centered",
    "dialogClassName",
    "raw"
  ]);
  const isAnimated = useMemo(() => props.animation ?? true, [props.animation]);

  const isMounted = useMountedState();

  const portalContainer =
    typeof document !== "undefined"
      ? document.querySelector("#modal-dialog-container") || document.body
      : null;

  useMount(() => document.addEventListener("keyup", onKeyUp));
  useUnmount(() => {
    document.removeEventListener("keyup", onKeyUp);
    document.body.classList.remove("overflow-hidden");
  });

  useEffect(() => {
    setShow(props.show);
  }, [props.show]);

  useEffect(() => {
    if (typeof show === "boolean") {
      if (!show) {
        props.onHide();
      }
    }
  }, [show]);

  useEffect(() => {
    show
      ? document.body.classList.add("overflow-hidden")
      : document.body.classList.remove("overflow-hidden");
  }, [show]);

  const onKeyUp = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      setShow(false);
    }
  };

  return (
    <ModalContext.Provider value={{ show, setShow }}>
      {isMounted() &&
        portalContainer &&
        createPortal(
          <AnimatePresence>
            {show && (
              <motion.div
                key="overlay"
                initial={{
                  opacity: 0
                }}
                animate={{
                  opacity: 0.5
                }}
                exit={{
                  opacity: 0
                }}
                className={classNameObject({
                  "bg-black z-[1100] fixed top-0 left-0 right-0 bottom-0": true,
                  [props.overlayClassName ?? ""]: !!props.overlayClassName
                })}
              />
            )}
          </AnimatePresence>,
          portalContainer
        )}

      {show &&
        portalContainer &&
        createPortal(
          <div
            {...nativeProps}
            className={classNameObject({
              "z-[1100] fixed top-0 pt-24 sm:py-4 md:py-8 left-0 right-0 bottom-0 overflow-y-auto h-full sm:h-auto":
                true,
              [props.className ?? ""]: true,
              "flex justify-center items-start": props.centered
            })}
            onClick={() => setShow(false)}
          >
            <motion.div
              initial={
                isAnimated && {
                  opacity: 0,
                  y: 24
                }
              }
              animate={
                isAnimated && {
                  opacity: 1,
                  y: 0
                }
              }
              exit={
                isAnimated
                  ? {
                      opacity: 0,

                      y: 24
                    }
                  : {}
              }
              onClick={(e) => e.stopPropagation()}
              className={classNameObject({
                "ecency-modal-content": true,
                " md:my-[3rem] w-full mt-auto mx-0 sm:mt-0 sm:mx-3 bg-white border border-[--border-color] rounded-t-xl sm:rounded-xl sm:w-[calc(100%-2rem)]":
                  !props.raw,
                "max-w-[500px]": !props.size || props.size === "md",
                "max-w-[800px]": props.size === "lg",
                "w-full sm:max-w-[375px]": props.size === "sm",
                [props.dialogClassName ?? ""]: true
              })}
            >
              {props.children}
            </motion.div>
          </div>,
          portalContainer
        )}
    </ModalContext.Provider>
  );
}

export * from "./modal-context";
export * from "./modal-body";
export * from "./modal-footer";
export * from "./modal-header";
export * from "./modal-title";
