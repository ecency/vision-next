import React, { HTMLProps, useContext } from "react";
import { DropdownContext } from "./dropdown-context";
import { classNameObject } from "@/features/ui/util";
import { chevronUpSvg } from "@ui/svg";
import { useFilteredProps } from "@/utils/props-filter";

interface Props {
  withChevron?: boolean;
  as?: "div" | "span";
}

export function DropdownToggle(props: HTMLProps<HTMLElement> & Props) {
  const { setShow, show } = useContext(DropdownContext);

  const Component = props.as ?? "div";

  const nativeProps = useFilteredProps(props, ["withChevron", "as"]);

  return (
    <Component
      {...nativeProps}
      className={classNameObject({
        "cursor-pointer ecency-dropdown-toggle": true,
        "flex items-center": !!props.withChevron,
        [props.className ?? ""]: !!props.className
      })}
      onClick={(e) => {
        setShow(!show);
        props.onClick?.(e);
      }}
    >
      {props.children}
      {props.withChevron && (
        <i className={classNameObject({ "inline-flex origin-center": true, "rotate-180": !show })}>
          {chevronUpSvg}
        </i>
      )}
    </Component>
  );
}
