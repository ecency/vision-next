import React, { HTMLProps } from "react";
import { classNameObject } from "@/features/ui/util";

export interface ToggleProps extends Omit<HTMLProps<HTMLElement>, "onChange"> {
  type: "checkbox";
  checked: boolean;
  onChange: (e: boolean) => void;
  label?: string;
  isToggle?: boolean;
}

export function Toggle({ checked, onChange, label, disabled }: ToggleProps) {
  return (
    <div
      className={classNameObject({
        "ecency-toggle cursor-pointer flex items-center gap-3": true
      })}
      onClick={() => onChange(!checked)}
    >
      <div
        className={classNameObject({
          "rounded-full p-0.5 w-[2.5rem] duration-300": true,
          "border-2 bg-green border-green": checked,
          "border-2 dark:border-gray-900 bg-gray-100 dark:bg-gray-800": !checked
        })}
      >
        <div
          className={classNameObject({
            "ecency-toggle-icon rounded-full w-3.5 h-3.5 duration-300": true,
            "bg-white translate-x-[1.125rem]": checked,
            "bg-gray-300 dark:bg-gray-600": !checked,
            "opacity-50": disabled
          })}
        />
      </div>
      {label && <div>{label}</div>}
    </div>
  );
}
