import { ReactNode } from "react";

interface Props {
  count: ReactNode;
  label: ReactNode;
}

export function EntryPageStatsItem({ count, label }: Props) {
  return (
    <div className="animate-fade-in-up flex flex-col items-center gap-1">
      <div className="text-xl lg:text-2xl text-blue-dark-sky">{count}</div>
      <div>{label}</div>
    </div>
  );
}
