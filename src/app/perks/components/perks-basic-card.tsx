import { LoginRequired } from "@/features/shared";
import clsx from "clsx";
import { HTMLProps } from "react";

export function PerksBasicCard(props: HTMLProps<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={clsx(
        "duration-300 border bg-white dark:bg-gray-900 w-full h-full rounded-xl overflow-hidden relative md:hover:rotate-1 border-transparent hover:border-blue-dark-sky",
        props.className
      )}
    >
      {props.children}
    </div>
  );
}
