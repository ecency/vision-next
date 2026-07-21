"use client";

import { InputGroup } from "./input-group";
import React, { HTMLAttributes, useState } from "react";
import useCopyToClipboard from "react-use/lib/useCopyToClipboard";
import { FormControl } from "./form-controls";
import { Button } from "@ui/button";
import { useDebounce } from "react-use";
import { UilCheck, UilCopy } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";

interface Props {
  value: string;
  onChange?: (v: string) => void;
  editable?: boolean;
  visibleValue?: string;
}

export function InputGroupCopyClipboard(props: Props & HTMLAttributes<HTMLElement>) {
  const [state, copy] = useCopyToClipboard();
  const [copied, setCopied] = useState(false);

  useDebounce(() => setCopied(false), 3000, [copied]);

  return (
    <InputGroup
      {...props}
      append={
        copied ? (
          <Button
            appearance="gray-link"
            icon={<UilCheck className="size-4 text-green animate-pop-in" />}
            aria-label={i18next.t("g.copied", { defaultValue: "Copied" })}
          />
        ) : (
          <Button
            appearance="gray-link"
            className="copy-to-clipboard"
            onClick={() => copy(props.value)}
            icon={<UilCopy className="size-4" />}
            aria-label={i18next.t("g.copy", { defaultValue: "Copy to clipboard" })}
          />
        )
      }
      onClick={() => {
        copy(props.value);
        setCopied(true);
      }}
    >
      <FormControl
        type="text"
        value={props.visibleValue ?? props.value}
        readOnly={props.editable ?? true}
        className="text-blue-dark-sky pointer"
        onChange={props.onChange}
      />
    </InputGroup>
  );
}
