import React, { HTMLProps, PropsWithChildren, ReactNode, useContext } from "react";
import { DropdownContext } from "@ui/dropdown/dropdown-context";
import { clsx } from "clsx";
import Link from "next/link";

interface Props {
  size?: "small" | "medium" | "large";
  href?: string;
  selected?: boolean;
  disabled?: boolean;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
}

type DropdownItemProps = {
  href?: string;
  selected?: boolean;
  disabled?: boolean;
  size?: "small" | "medium" | "large";
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  children: React.ReactNode;
} & Omit<React.HTMLAttributes<HTMLElement>, "onClick">;

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

export function DropdownItem({
  href,
  selected,
  disabled,
  size,
  className,
  onClick,
  children,
  ...rest
}: DropdownItemProps) {
  const { setShow } = useContext(DropdownContext);

  const baseClasses = clsx(
    "cursor-pointer rounded-tr-xl text-sm rounded-br-xl duration-200",
    "min-w-[80%] block w-full",
    size === "small" ? "px-2 py-1" : "px-3 py-1.5",
    selected
      ? "bg-blue-dark-sky-040 text-blue-dark-sky dark:text-white dark:bg-gray-900 hover:bg-blue-dark-sky-030 dark:hover:bg-gray-800"
      : "hover:bg-blue-dark-sky-040 text-dark-default hover:text-blue-dark-sky dark:text-white dark:hover:bg-dark-default",
    disabled && "opacity-50 cursor-not-allowed",
    className
  );

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    setShow(false);
    onClick?.(e);
  };

  if (href) {
    return (
      <Link
        href={href}
        className={baseClasses}
        onClick={handleClick}
        {...(rest as React.AnchorHTMLAttributes<HTMLAnchorElement>)}>

        {children}

      </Link>
    );
  }

  return (
    <div
      className={baseClasses}
      onClick={handleClick}
      {...(rest as React.HTMLAttributes<HTMLDivElement>)}
    >
      {children}
    </div>
  );
}

export function DropdownItemWithIcon(
  props: Omit<HTMLProps<HTMLDivElement>, "label"> & Props & { icon?: ReactNode; label: ReactNode }
) {
  const { icon, label, className, ...rest } = props;

  return (
    <DropdownItem
      {...rest}
      className={clsx(
        "flex items-center gap-3 text-gray-600 dark:text-gray-400 hover:text-blue-dark-sky [&>span>svg]:w-4",
        className
      )}
    >
      {icon && <span className="flex items-center">{icon}</span>}
      <span className="text-sm font-semibold">{label}</span>
    </DropdownItem>
  );
}

export function DropdownItemHeader(props: PropsWithChildren<HTMLProps<HTMLDivElement>>) {
  return <div className="px-4 text-sm font-semibold opacity-50" {...props} />;
}
