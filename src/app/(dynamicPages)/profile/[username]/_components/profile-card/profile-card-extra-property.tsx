import { PropsWithChildren, ReactNode } from "react";

interface Props {
  icon: ReactNode;
  label: string;
}

export function ProfileCardExtraProperty({ icon, label, children }: PropsWithChildren<Props>) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-gray-600 dark:text-gray-400">{icon}</div>
      <div className="flex flex-col text-sm">
        <div className="opacity-50">{label}</div>
        {children}
      </div>
    </div>
  );
}
