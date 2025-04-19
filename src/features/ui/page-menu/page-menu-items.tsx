import clsx from "clsx";
import { HTMLProps, PropsWithChildren } from "react";

export function PageMenuItems(props: PropsWithChildren & HTMLProps<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={clsx(
        "hidden lg:flex bg-white gap-2 md:gap-4 items-center rounded-xl p-2 lg:px-4",
        props.className
      )}
    />
  );
}
