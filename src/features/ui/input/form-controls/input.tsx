import React, { forwardRef, HTMLProps } from "react";
import { INPUT_DARK_STYLES, INPUT_SIZES, INPUT_STYLES, INVALID_INPUT_STYLES } from "./input-styles";
import { classNameObject, useFilteredProps } from "@/features/ui/util";

export interface InputProps extends Omit<HTMLProps<HTMLInputElement>, "size"> {
  type: "text" | "password" | "number" | "email" | "range" | "date";
  noStyles?: boolean;
  // TODO: styles for that
  plaintext?: boolean;
  size?: "sm" | "md";
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ForwardedInput = forwardRef<HTMLInputElement, InputProps>((props, ref) => {
  const nativeProps = useFilteredProps(props, ["noStyles", "plaintext"]);

  return (
    <input
      ref={ref}
      {...nativeProps}
      className={classNameObject({
        [INPUT_STYLES]: !(props.noStyles ?? false),
        [INPUT_DARK_STYLES]: !(props.noStyles ?? false),
        [INVALID_INPUT_STYLES]: !(props.noStyles ?? false),
        [INPUT_SIZES[props.size ?? "md"]]: true,
        [props.className ?? ""]: !!props.className
      })}
    />
  );
});

ForwardedInput.displayName = "Input";

export const Input = ForwardedInput;
