"use client";

import { classNameObject } from "@ui/util";

interface Props {
  isSelected?: boolean;
  name: string;
  onSelect: () => void;
  title: string;
  i: number;
}

export function TabItem({ isSelected = false, name, onSelect, title }: Props) {
  // Tabs are navigation — they render instantly (the old staggered entrance
  // delayed them by up to i*200ms). Only the selection dot animates.
  return (
    <div
      className={classNameObject({
        " py-4 px-2 lg:px-3 xl:px-4 flex flex-col items-center relative cursor-pointer": true,
        "text-blue-dark-sky": isSelected
      })}
      key={name}
      onClick={onSelect}
    >
      {title}
      {isSelected && (
        <span className="rounded-full absolute size-1 bottom-2 bg-blue-dark-sky animate-pop-in" />
      )}
    </div>
  );
}
