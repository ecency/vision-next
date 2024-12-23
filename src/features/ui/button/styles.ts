import { ButtonAppearance, ButtonSize } from "@ui/button/props";

export const BUTTON_STYLES: Record<ButtonAppearance, string> = {
  primary:
    "bg-blue-dark-sky hover:bg-blue-dark-sky-hover focus:bg-blue-dark-sky-active text-white hover:text-white disabled:opacity-50 disabled:hover:bg-blue-dark-sky disabled:focus:bg-blue-dark-sky",
  secondary:
    "bg-gray-600 hover:bg-gray-700 focus:bg-gray-800 text-white dark:bg-blue-metallic-20 dark:hover:bg-blue-metallic",
  link: "text-blue-dark-sky hover:text-blue-dark-sky-hover focus:text-blue-dark-sky-active",
  danger: "bg-red hover:bg-red-020 focus:bg-red-030 text-white",
  success: "bg-green hover:bg-green-020 focus:bg-green-020 text-white",
  warning: "",
  info: "bg-info-default hover:info-hover focus:bg-info-focus text-white disabled:opacity-50 disabled:hover:bg-info-default disabled:focus:bg-info-default",
  "gray-link": "text-gray-600 hover:text-blue-dark-sky focus:text-blue-dark-sky-active",
  "white-link": "text-white hover:opacity-50 focus:opacity-75",
  pressed: "text-red hover:text-red-040 bg:blue-duck-egg dark:bg-dark-default"
};

export const BUTTON_OUTLINE_STYLES: Record<ButtonAppearance, string> = {
  primary:
    "border-blue-dark-sky hover:border-blue-dark-sky-hover focus:border-blue-dark-sky-active text-blue-dark-sky hover:text-blue-dark-sky-hover focus:text-blue-dark-sky-active disabled:opacity-50",
  secondary:
    "border-gray-400 hover:border-gray-700 focus:border-gray-800 text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-500",
  link: "",
  danger:
    "border-red hover:border-red-020 focus:border-red-030 text-red hover:text-red-020 focus:text-red-030",
  success: "",
  warning: "",
  info: "border-info-default hover:border-info-hover focus:border-info-focus text-info-default hover:text-info-hover focus:text-info-focus",
  "gray-link": "",
  "white-link": "",
  pressed: ""
};

export const BUTTON_SIZES: Record<ButtonSize, string> = {
  xxs: "h-4 text-xs [&>div>svg]:w-4",
  xs: "h-[2rem] text-sm font-[500] px-2 text-xs",
  sm: "h-[2rem] text-sm font-[500] px-2",
  md: "h-[2.125rem] px-3",
  lg: "h-[2.5rem] px-4",
  display: "h-[3rem] px-4 text-sm font-semibold"
};

export const BUTTON_IN_GROUP =
  "[&>.ecency-input-group-part>button]:rounded-tl-none [&>.ecency-input-group-part>button]:rounded-bl-none [&>.ecency-input-group-part>button]:h-[2.75rem]";
