"use client";

import { HTMLAttributes, ReactNode, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useFilteredProps } from "../util";
import { Placement } from "@popperjs/core";
import { PopoverPopper } from "@ui/popover/popover-popper";
import { useMountedState, useWindowSize } from "react-use";
import { PopoverSheet } from "@ui/popover/popover-sheet";

interface ShowProps {
  show: boolean;
  setShow: (v: boolean) => void;
  children: ReactNode;
  stopPropagationForChild?: boolean;
  placement?: Placement;
}

interface Props {
  children: ReactNode;
  anchorParent?: boolean;
  customClassName?: string;
  useMobileSheet?: boolean;
  stopPropagationForChild?: boolean;
}

export function Popover(props: (ShowProps | Props) & HTMLAttributes<HTMLDivElement>) {
  const nativeProps = useFilteredProps(props, [
    "anchorParent",
    "show",
    "setShow",
    "customClassName",
    "useMobileSheet"
  ]);

  const [host, setHost] = useState<any>();
  const [show, setShow] = useState((props as ShowProps).show ?? false);

  const isMounted = useMountedState();
  const windowSize = useWindowSize();

  const isSheet = useMemo(
    () => windowSize.width < 768 && (props as Props).useMobileSheet,
    [props, windowSize.width]
  );
  useEffect(() => {
    setShow((props as ShowProps).show ?? false);
  }, [props]);

  useEffect(() => {
    if ((props as Props).anchorParent && host) {
      host.parentElement.addEventListener("click", () => setShow(true));
      host.parentElement.addEventListener("mouseenter", () => setShow(true));
      host.parentElement.addEventListener("mouseleave", () => setShow(false));
    }
  }, [host, props]);

  return (
    <div {...nativeProps} ref={setHost}>
      {isMounted() && !isSheet && (
        <PopoverPopper
          host={host}
          setShow={setShow}
          show={show}
          stopPropagationForChild={props.stopPropagationForChild}
          placement={"placement" in props ? props.placement : undefined}
          customClassName={"customClassName" in props ? props.customClassName : undefined}
        >
          {props.children}
        </PopoverPopper>
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
