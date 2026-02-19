import { PropsWithChildren, ReactNode } from "react";

interface Props {
  icon: ReactNode;
  label: string;
}

export function ProfileCardExtraProperty({ icon, label, children }: PropsWithChildren<Props>) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="text-gray-600 dark:text-gray-400 shrink-0">{icon}</div>
      <div className="flex flex-col text-sm min-w-0">
        <div className="opacity-50">{label}</div>
        <div className="truncate">{children}</div>
      </div>
    </div>
  );
}
