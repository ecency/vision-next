import React, { forwardRef } from "react";
import { Textarea, TextareaProps } from "./textarea";
import { Select, SelectProps } from "./select";
import { Input, InputProps } from "./input";
import { Checkbox, CheckboxProps } from "./checkbox";
import { Toggle } from "@/features/ui/input/form-controls/toggle";

type Props = InputProps | TextareaProps | SelectProps | CheckboxProps;

export const FormControl = forwardRef<any, Props>((props, ref) => {
  switch (props.type) {
    case "textarea":
      return <Textarea {...props} ref={ref as any} />;
    case "select":
      return (
        <Select {...props} ref={ref as any}>
          {props.children}
        </Select>
      );
    case "checkbox":
      if (props.isToggle) {
        return <Toggle {...props} ref={ref as any} />;
      }
      return <Checkbox {...props} ref={ref as any} />;
    default:
      return <Input {...props} ref={ref as any} />;
  }
});

FormControl.displayName = "FormControl";

export * from "./input-skeleton-loader";
