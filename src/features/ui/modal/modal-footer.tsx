import React, { HTMLProps } from "react";
import { classNameObject, useFilteredProps } from "@ui/util";

export function ModalFooter(props: HTMLProps<HTMLDivElement> & { sticky?: boolean }) {
  const filteredProps = useFilteredProps(props, ["sticky"]);

  return (
    <div
      {...filteredProps}
      className={classNameObject({
        "p-3 mb-4 sm:mb-0": true,
        "sticky bottom-0 z-20 bg-white border-t border-[--border-color]": props.sticky ?? false,
        [props.className ?? ""]: true
      })}
    />
  );
}
