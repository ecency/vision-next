"use client";

import React, { HTMLProps, useContext, useRef } from "react";
import { AccordionContext } from "@/features/ui/accordion/accordion-context";
import { classNameObject, useFilteredProps } from "@/features/ui/util";

export function AccordionCollapse(
  props: HTMLProps<HTMLDivElement> & { eventKey: string; overflowHidden?: boolean }
) {
  const { show } = useContext(AccordionContext);
  const collapseRef = useRef<HTMLDivElement | null>(null);
  const nativeProps = useFilteredProps(props, ["eventKey", "overflowHidden"]);

  return (
    <div
      className={classNameObject({
        "overflow-hidden": props.overflowHidden ?? true,
        hidden: !show[props.eventKey]
      })}
    >
      <div {...nativeProps} ref={collapseRef} />
    </div>
  );
}
