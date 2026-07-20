import React, { forwardRef } from "react";
import { ButtonProps } from "./props";
import { classNameObject, useFilteredProps } from "@/features/ui/util";
import { BUTTON_OUTLINE_STYLES, BUTTON_SIZES, BUTTON_STYLES } from "@/features/ui/button/styles";
import Link from "next/link";
import { UilSpinner } from "@tooni/iconscout-unicons-react";

export * from "./props";

const warnedKeys = new Set<string>();

function warnMissingLabel(props: ButtonProps) {
  if (process.env.NODE_ENV === "production") return;
  if (!props.icon) return;
  if (typeof props.children === "string" && props.children.trim().length > 0) return;
  if (props.children) return;
  if (props["aria-label"] || props["aria-labelledby"] || props.title) return;

  const key = (props.className ?? "") + "|" + ("href" in props ? props.href : "");
  if (warnedKeys.has(key)) return;
  warnedKeys.add(key);

  console.warn(
    "[a11y] <Button> with `icon` prop is missing an accessible label. " +
      "Add `aria-label` (translated string) so screen readers can announce it.",
    { className: props.className, href: "href" in props ? props.href : undefined }
  );
}

const ForwardedButton = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  (props, ref) => {
    warnMissingLabel(props);

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

    const className = classNameObject({
      // Basic
      "cursor-pointer rounded-xl duration-300 no-wrap active:scale-95": true,
      "!cursor-not-allowed": props.disabled === true,
      // Outline basics
      "border-[1.25px] border-solid": props.outline ?? false,
      // With icon
      "flex items-center justify-center gap-2": !!props.icon || props.isLoading,
      "flex-row-reverse": props.iconPlacement === "left",

      // Styles
      [BUTTON_STYLES[props.appearance ?? "primary"]]: !props.outline,
      [BUTTON_OUTLINE_STYLES[props.appearance ?? "primary"]]: props.outline ?? false,
      [BUTTON_SIZES[props.size ?? "md"]]: true,

      // Misc
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
          {props.isLoading ? <UilSpinner className="w-5 h-5 animate-spin" /> : props.icon}
        </div>
      ) : (
        <></>
      );
    const children = props.children ? <div>{props.children}</div> : <></>;

    return "href" in props ? (
      <Link {...nativeProps} className={className} ref={ref as any}>
        {props.isLoading && props.loadingText ? props.loadingText : children}
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
        {props.isLoading && props.loadingText ? props.loadingText : children}
        {icon}
      </button>
    );
  }
);

ForwardedButton.displayName = "Button";

export const Button = ForwardedButton;
export * from "./button-loading";
