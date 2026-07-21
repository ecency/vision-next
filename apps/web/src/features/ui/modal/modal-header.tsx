import React, { HTMLProps, useContext } from "react";
import { ModalContext } from "./modal-context";
import { classNameObject, useFilteredProps } from "@/features/ui/util";
import { Button } from "@ui/button";
import { UilMultiply } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";

interface Props {
  closeButton: boolean;
  thin?: boolean;
}

export function ModalHeader(props: HTMLProps<HTMLDivElement> & Props) {
  const context = useContext(ModalContext);
  const nativeProps = useFilteredProps(props, ["closeButton", "thin"]);

  return (
    <div
      {...nativeProps}
      className={classNameObject({
        "flex sticky bg-white z-20 -top-24 sm:-top-4 md:-top-8 items-center font-semibold rounded-t-xl sm:rounded-xl": true,
        "justify-between": !!props.children,
        "justify-end": !props.children,
        [props.className ?? ""]: true,
        "p-0": props.thin,
        "p-3": !props.thin
      })}
    >
      {props.children}
      {props.closeButton && (
        <Button
          appearance="gray"
          aria-label={i18next.t("g.close", { defaultValue: "Close" })}
          noPadding={true}
          size="sm"
          className="absolute top-3 right-3 w-8"
          onClick={() => context.setShow(false)}
          icon={<UilMultiply className="!size-4" />}
        />
      )}
    </div>
  );
}
