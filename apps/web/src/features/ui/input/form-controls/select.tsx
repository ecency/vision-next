import React, { HTMLProps, ReactNode } from "react";
import { INPUT_DARK_STYLES, INPUT_SIZES, INPUT_STYLES } from "@ui/input/form-controls/input-styles";
import { classNameObject, useFilteredProps } from "@ui/util";

// TODO: Add styles for select in input-group

export interface SelectProps extends Omit<HTMLProps<HTMLSelectElement>, "size"> {
  type: "select";
  children: ReactNode;
  full?: boolean;
  size?: "md" | "xs" | "sm";
}

export function Select(props: SelectProps) {
  const nativeProps = useFilteredProps(props, ["full"]);

  return (
    <select
      {...nativeProps}
      className={classNameObject({
        [INPUT_STYLES]: true,
        [INPUT_DARK_STYLES]: true,
        [INPUT_SIZES[props.size ?? "md"]]: true,
        [props.className ?? ""]: true,
        "!w-auto": props.full === false
      })}
    >
      {props.children}
    </select>
  );
}
