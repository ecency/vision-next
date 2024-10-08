import React, { HTMLProps, useContext } from "react";
import { ModalContext } from "./index";
import { classNameObject, useFilteredProps } from "@/features/ui/util";
import { closeSvg } from "@/features/ui/svg";

interface Props {
  closeButton: boolean;
  thin?: boolean;
}

export function ModalHeader(props: HTMLProps<HTMLDivElement> & Props) {
  const context = useContext(ModalContext);
  const nativeProps = useFilteredProps(props, ["closeButton", "thin"]);

  return (
    <div
      {...nativeProps}
      className={classNameObject({
        "flex sticky bg-white z-10 top-0 items-center": true,
        "justify-between": !!props.children,
        "justify-end": !props.children,
        [props.className ?? ""]: true,
        "p-0": props.thin,
        "p-3": !props.thin
      })}
    >
      {props.children}
      {props.closeButton && (
        <button
          aria-label="Close"
          className="w-5 h-5 opacity-50 absolute top-3 right-3 hover:opacity-100"
          onClick={() => context.setShow(false)}
        >
          {closeSvg}
        </button>
      )}
    </div>
  );
}
