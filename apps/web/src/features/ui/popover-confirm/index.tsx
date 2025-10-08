"use client";

import { Button } from "@ui/button";
import { Popover, PopoverContent, PopoverTitle } from "@ui/popover";
import i18next from "i18next";
import { cloneElement, ReactElement, useState } from "react";

interface Props {
  titleText?: string;
  okText?: string;
  okVariant?: "primary" | "danger";
  cancelText?: string;
  children: ReactElement;
  onConfirm?: () => void;
  onCancel?: () => void;
  trigger?: any;
  placement?: any;
  containerRef?: React.RefObject<HTMLElement>;
}
export function PopoverConfirm({
  titleText,
  okText,
  okVariant,
  cancelText,
  children,
  trigger,
  containerRef,
  placement,
  onConfirm,
  onCancel
}: Props) {
  const [show, setShow] = useState(false);

  const confirm = () => {
    setShow(false);
    onConfirm?.();
  };

  const cancel = () => {
    setShow(false);
    onCancel?.();
  };

  const clonedChildren = cloneElement(children, {
    onClick: () => setShow(!show)
  });

  return (
    <Popover
      directContent={clonedChildren}
      behavior="click"
      placement={placement}
      show={show}
      setShow={(value) => setShow(value)}
    >
      <PopoverTitle className="!p-4 whitespace-nowrap">
        {titleText || i18next.t("confirm.title")}
      </PopoverTitle>
      <PopoverContent>
        <div className="flex gap-2">
          <Button
            size="sm"
            appearance={okVariant || "primary"}
            style={{ marginRight: "10px" }}
            onClick={confirm}
          >
            {okText || i18next.t("confirm.ok")}
          </Button>
          <Button size="sm" appearance="gray-link" onClick={cancel}>
            {cancelText || i18next.t("confirm.cancel")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
