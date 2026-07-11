"use client";

import React, { HTMLProps, useContext, useRef, useState } from "react";
import { DropdownContext } from "@ui/dropdown/dropdown-context";
import useClickAway from "react-use/lib/useClickAway";
import { UIContext } from "@ui/core";
import { classNameObject, useFilteredProps } from "@ui/util";

export * from "./dropdown-item";
export * from "./dropdown-menu";
export * from "./dropdown-toggle";

interface Props {
  show?: boolean;
  setShow?: (v: boolean) => void;
  closeOnClickOutside?: boolean;
}

export function Dropdown(props: HTMLProps<HTMLDivElement> & Props) {
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const { openPopovers } = useContext(UIContext);

  useClickAway(ref, (e) => {
    // An open click-popover anchored inside THIS dropdown (e.g. a confirm
    // popover whose buttons render in a portal outside our DOM) — keep the
    // menu mounted until the popover is answered; closing now would unmount
    // the popover before its buttons' click handlers can fire. Popovers open
    // elsewhere on the page don't block dismissal.
    const hostsOpenPopover = Array.from(openPopovers).some((anchor) =>
      ref.current?.contains(anchor)
    );
    if (hostsOpenPopover) {
      return;
    }

    setShow(false);

    if (!isInsideDropdown(e) && (props.closeOnClickOutside ?? true)) {
      setShow(false);
      props.setShow?.(false);
    }
  });
  const nativeProps = useFilteredProps(props, ["show", "setShow", "closeOnClickOutside"]);

  const isInsideDropdown = (e: Event) => {
    let target = e.target as HTMLElement | null;
    while (!target?.parentElement?.classList.contains("ecency-dropdown-menu") && target) {
      target = target?.parentElement ?? null;
    }

    return !!target;
  };

  const isOpen = props.show ?? show;

  return (
    <DropdownContext.Provider
      value={{
        show: isOpen,
        setShow: (v) => {
          setShow(v);
          props.setShow?.(v);
        }
      }}
    >
      <div
        {...nativeProps}
        ref={ref}
        className={classNameObject({
          relative: true,
          "z-[10]": isOpen,
          "overflow-visible": isOpen,
          [props.className ?? ""]: !!props.className
        })}
      />
    </DropdownContext.Provider>
  );
}
