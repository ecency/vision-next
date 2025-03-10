import { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonAppearance =
  | "primary"
  | "secondary"
  | "gray"
  | "gray-link"
  | "link"
  | "danger"
  | "success"
  | "warning"
  | "info"
  | "white-link"
  | "white"
  | "hivesigner"
  // User pressed style for buttons with pressed(not) statements like favourite like button
  | "pressed";
export type ButtonSize = "xxs" | "xs" | "sm" | "md" | "lg" | "display";

interface RegularButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  appearance?: ButtonAppearance;
  size?: ButtonSize;
  outline?: boolean;
  className?: string;
  disabled?: boolean;
  full?: boolean;
  icon?: ReactNode;
  iconPlacement?: "left" | "right";
  iconClassName?: string;
  noPadding?: boolean;
  isLoading?: boolean;
  loadingText?: string;
}

interface LinkButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  appearance?: ButtonAppearance;
  size?: ButtonSize;
  outline?: boolean;
  className?: string;
  disabled?: boolean;
  full?: boolean;
  icon?: ReactNode;
  iconPlacement?: "left" | "right";
  iconClassName?: string;
  noPadding?: boolean;
  isLoading?: boolean;
  loadingText?: string;
}

export type ButtonProps = RegularButtonProps | LinkButtonProps;
