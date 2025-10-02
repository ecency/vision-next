import { format } from "date-fns";
import i18next from "i18next";
import { PropsWithChildren, ReactNode } from "react";

interface Props {
  icon: ReactNode;
  type: string;
  timestamp: string | number;
  numbers: ReactNode;
}

export function ProfileWalletTokenHistoryHiveItem({
  icon,
  type,
  timestamp,
  children,
  numbers
}: PropsWithChildren<Props>) {
  return (
    <div className="leading-[1] border-b border-[--border-color] p-4 grid items-start gap-4 grid-cols-[32px_2fr_2fr_1fr] last:border-0">
      <div className="text-blue-dark-sky bg-blue-duck-egg dark:bg-blue-dark-grey flex items-center justify-center p-2 rounded-lg">
        {icon}
      </div>
      <div className="transaction-title">
        <div>{i18next.t(`transactions.type-${type}`)}</div>
        <div className="text-sm mt-1 text-gray-600 dark:text-gray-400">
          {format(new Date(timestamp), "dd.MM.yyyy hh:mm")}
        </div>
      </div>
      <div className="text-sm">{children}</div>
      <div className="text-blue-dark-sky text-right">{numbers}</div>
    </div>
  );
}
