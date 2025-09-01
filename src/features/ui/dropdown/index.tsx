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
    if (openPopovers.size === 0) {
      setShow(false);
    } else {
      return;
    }

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
