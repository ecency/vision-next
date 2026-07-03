"use client";

import { createElement, PropsWithChildren, useContext } from "react";
import { AccordionContext } from "./accordion-context";
import { useFilteredProps } from "@/features/ui/util";

interface Props extends PropsWithChildren<any> {
  as?: any;
  eventKey: string;
}

export function AccordionToggle(props: Props) {
  const { show, setShow } = useContext(AccordionContext);
  const nativeProps = useFilteredProps(props, ["eventKey", "as"]);

  return createElement(
    props.as ?? "div",
    {
      ...nativeProps,
      // Additive: expose the open state so consumers can style chevrons/carets
      // (e.g. [[data-open=true]_&]:rotate-180) without new API surface
      "data-open": show[props.eventKey] ?? false,
      onClick: () =>
        setShow({
          ...show,
          [props.eventKey]: !show[props.eventKey] ?? false
        })
    },
    props.children
  );
}
