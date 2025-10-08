"use client";

import React, { forwardRef } from "react";
import { ButtonProps } from "./props";
import { classNameObject, useFilteredProps } from "@/features/ui/util";
import { BUTTON_OUTLINE_STYLES, BUTTON_SIZES, BUTTON_STYLES } from "@/features/ui/button/styles";
import Link from "next/link";
import { UilSpinner } from "@tooni/iconscout-unicons-react";
import { motion } from "framer-motion";
import clsx from "clsx";

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
      "full",
      "isLoading",
      "loadingText"
    ]);

    const showLoadingText = Boolean(props.isLoading && props.loadingText);
    const hasChildrenContent = React.Children.count(props.children) > 0;
    const hasTextContent = showLoadingText || hasChildrenContent;
    const shouldHideText = props.isLoading && !props.loadingText;

    const className = classNameObject({
      // Basic
      "cursor-pointer rounded-xl duration-300 no-wrap active:scale-95 overflow-hidden relative":
        true,
      "!cursor-not-allowed": props.disabled === true,
      // Outline basics
      "border-[1.25px] border-solid": props.outline ?? false,
      // With icon
      "flex items-center justify-center": !!props.icon || props.isLoading,
      "gap-2": Boolean((props.icon || props.isLoading) && hasTextContent),
      "flex-row-reverse": props.iconPlacement === "left",

      // Styles
      [BUTTON_STYLES[props.appearance ?? "primary"]]: !props.outline,
      [BUTTON_OUTLINE_STYLES[props.appearance ?? "primary"]]: props.outline ?? false,
      [BUTTON_SIZES[props.size ?? "md"]]: true,

      // Misc
      "after:!hidden": (props as any).target === "_blank",
      [props.className ?? ""]: true,
      "!p-0": props.noPadding,
      "w-full": props.full ?? false
    });

    const icon =
      props.icon || props.isLoading ? (
        <div
          className={classNameObject({
            "flex justify-center items-center": true,
            [props.iconClassName ?? ""]: true,
            "w-4 h-4 [&>svg]:w-4 [&>svg]:h-4": props.size === "xs",
            "w-5 h-5 [&>svg]:w-5 [&>svg]:h-5": props.size !== "xs"
          })}
        >
          {props.isLoading ? (
            <motion.span
              initial={{ opacity: 0, y: 16 }}
              animate={{
                opacity: props.isLoading ? 1 : 0,
                y: props.isLoading ? 0 : 16
              }}
              className={clsx(
                props.isLoading &&
                  !props.loadingText &&
                  "absolute top-0 left-0 flex items-center justify-center w-full z-[1] h-full"
              )}
            >
              <UilSpinner className="w-5 h-5 animate-spin" />
            </motion.span>
          ) : (
            props.icon
          )}
        </div>
      ) : (
        <></>
      );
    const textContent = hasTextContent ? (
      <span className={clsx(shouldHideText && "hidden")}>
        {showLoadingText ? props.loadingText : props.children}
      </span>
    ) : null;

    return "href" in props ? (
      <Link {...nativeProps} className={className} ref={ref as any}>
        {textContent}
        {icon}
      </Link>
    ) : (
      <button
        {...nativeProps}
        disabled={nativeProps.disabled || props.isLoading}
        style={{
          ...props.style,
          outline: "none"
        }}
        type={props.type ?? "button"}
        className={className}
        ref={ref as any}
      >
        {textContent}
        {icon}
      </button>
    );
  }
);

ForwardedButton.displayName = "Button";

export const Button = ForwardedButton;
export * from "./button-loading";
