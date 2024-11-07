"use client";

import React, { HTMLProps } from "react";
import { classNameObject } from "@/features/ui/util";
import { UilCheck } from "@tooni/iconscout-unicons-react";

export interface CheckboxProps extends Omit<HTMLProps<HTMLElement>, "onChange"> {
  type: "checkbox";
  isToggle?: boolean;
  checked: boolean;
  onChange: (e: boolean) => void;
  label?: string;
}

export function Checkbox({ checked, onChange, label, disabled }: CheckboxProps) {
  return (
    <div
      className="ecency-checkbox cursor-pointer flex items-center justify-center gap-3"
      onClick={() => onChange(!checked)}
    >
      <div
        className={classNameObject({
          "border-2 dark:border-gray-600 rounded-md w-[1.25rem] h-[1.25rem] flex items-center justify-center":
            true,
          "hover:border-gray-400": !disabled,
          "opacity-50": disabled
        })}
      >
        {checked ? <UilCheck className="w-3.5 h-3.5 dark:text-gray-400" /> : <></>}
      </div>
      {label && <div>{label}</div>}
    </div>
  );
}
