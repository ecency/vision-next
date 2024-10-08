import React, { forwardRef } from "react";
import { ButtonProps } from "./props";
import { classNameObject, useFilteredProps } from "@/features/ui/util";
import { BUTTON_OUTLINE_STYLES, BUTTON_SIZES, BUTTON_STYLES } from "@/features/ui/button/styles";
import Link from "next/link";

export * from "./props";

const ForwardedButton = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  (props, ref) => {
    const nativeProps = useFilteredProps<typeof props, Required<ButtonProps>>(props, [
      "appearance",
      "outline",
      "icon",
      "iconPlacement",
      "iconClassName",
      "noPadding",
      "full"
    ]);

    const className = classNameObject({
      // Basic
      "cursor-pointer rounded-full duration-300 no-wrap": true,
      // Outline basics
      "border-[1.25px] border-solid": props.outline ?? false,
      // With icon
      "flex items-center justify-center gap-2": !!props.icon,
      "flex-row-reverse": props.iconPlacement === "left",

      // Styles
      [BUTTON_STYLES[props.appearance ?? "primary"]]: !props.outline ?? true,
      [BUTTON_OUTLINE_STYLES[props.appearance ?? "primary"]]: props.outline ?? false,
      [BUTTON_SIZES[props.size ?? "md"]]: true,

      // Misc
      [props.className ?? ""]: true,
      "!p-0": props.noPadding,
      "w-full": props.full ?? false
    });

    const icon = props.icon ? (
      <div
        className={classNameObject({
          "flex justify-center items-center w-5 h-5 [&>svg]:w-5 [&>svg]:h-5": true,
          [props.iconClassName ?? ""]: true
        })}
      >
        {props.icon}
      </div>
    ) : (
      <></>
    );
    const children = props.children ? <div>{props.children}</div> : <></>;

    return "href" in props ? (
      <Link {...nativeProps} className={className} ref={ref as any}>
        {children}
        {icon}
      </Link>
    ) : (
      <button
        {...nativeProps}
        style={{
          ...props.style,
          outline: "none"
        }}
        type={props.type ?? "button"}
        className={className}
        ref={ref as any}
      >
        {children}
        {icon}
      </button>
    );
  }
);

ForwardedButton.displayName = "Button";

export const Button = ForwardedButton;
