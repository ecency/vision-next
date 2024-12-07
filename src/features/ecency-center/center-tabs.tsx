import { useEffect, useRef, useState } from "react";
import { TabItem } from "@ui/tabs";

interface Props {
  tabs: {
    title: string;
    key: string;
  }[];
  onSelect: (v: string) => void;
}

export function CenterTabs({ tabs, onSelect }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const [current, setCurrent] = useState(tabs[0].key);

  useEffect(() => {
    onSelect(current);
  }, [current, onSelect]);

  return (
    <div
      ref={ref}
      className="border-b border-[--border-color] grid grid-cols-3 items-center text-center text-sm font-semibold"
    >
      {tabs.map((tab, i) => (
        <TabItem
          isSelected={tab.key === current}
          key={tab.key}
          name={tab.key}
          onSelect={() => setCurrent(tab.key)}
          title={tab.title}
          i={i}
        />
      ))}
    </div>
  );
}
