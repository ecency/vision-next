"use client";

import { InputGroup } from "./input-group";
import React, { HTMLAttributes, useState } from "react";
import useCopyToClipboard from "react-use/lib/useCopyToClipboard";
import { FormControl } from "./form-controls";
import { Button } from "@ui/button";
import { useDebounce } from "react-use";
import { UilCheck, UilCopy } from "@tooni/iconscout-unicons-react";

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
          <Button appearance="gray-link" icon={<UilCheck className="w-4 h-4 text-green" />} />
        ) : (
          <Button
            appearance="gray-link"
            className="copy-to-clipboard"
            onClick={() => copy(props.value)}
            icon={<UilCopy className="w-4 h-4" />}
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
