import React, { HTMLProps, PropsWithChildren, ReactNode, useContext } from "react";
import { DropdownContext } from "@ui/dropdown/dropdown-context";
import { classNameObject } from "@ui/util";
import { clsx } from "clsx";

interface Props {
  size?: "small" | "medium" | "large";
}

export interface MenuItem {
  label: string | JSX.Element;
  href?: string;
  onClick?: () => void;
  selected?: boolean;
  flash?: boolean;
  disabled?: boolean;
  id?: string;
  icon?: JSX.Element;
  content?: JSX.Element;
  isStatic?: boolean;
}

export function DropdownItem(props: HTMLProps<HTMLDivElement> & Props) {
  const { setShow } = useContext(DropdownContext);

  return (
    <div
      {...props}
      className={classNameObject({
        "min-w-[80%] cursor-pointer [&>a]:text-dark-default dark:text-white dark:[&>a]:text-white rounded-tr-xl rounded-br-xl duration-200":
          true,
        "bg-blue-dark-sky-040 text-blue-dark-sky dark:bg-gray-900 hover:bg-blue-dark-sky-030 dark:hover:bg-gray-800":
          props.selected ?? false,
        "hover:bg-blue-dark-sky-040 text-dark-default hover:text-blue-dark-sky dark:hover:bg-dark-default":
          !(props.selected ?? false),
        "px-3 py-1.5": !props.size || props.size === "medium",
        "px-2 py-1 text-sm": !props.size || props.size === "small",
        "opacity-50 cursor-not-allowed": props.disabled,
        [props.className ?? ""]: !!props.className
      })}
      onClick={(e) => {
        setShow(false);
        props.onClick?.(e);
      }}
    />
  );
}

export function DropdownItemWithIcon(
  props: Omit<HTMLProps<HTMLDivElement>, "label"> & Props & { icon?: ReactNode; label: any }
) {
  return (
    <DropdownItem {...props}>
      <div
        className={clsx(
          "flex items-center gap-3 text-gray-600 dark:text-gray-400 hover:text-blue-dark-sky [&>div>svg]:w-4",
          props.className
        )}
      >
        <div className="flex items-center">{props.icon}</div>
        <div className="text-sm font-semibold">{props.label}</div>
      </div>
    </DropdownItem>
  );
}

export function DropdownItemHeader(props: PropsWithChildren<HTMLProps<HTMLDivElement>>) {
  return <div className="px-4 text-sm font-semibold opacity-50" {...props} />;
}
