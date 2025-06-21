import { ReactNode } from "react";

interface Props {
  title: string;
  description: string;
  icon: ReactNode;
}

export function PerkListItem({ title, description, icon }: Props) {
  return (
    <div className="border-b last:border-b-0 border-[--border-color] p-2 md:p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-900">
      <div className="flex items-center gap-2 md:gap-4 pb-2 md:pb-4">
        <div className="bg-gray-200 dark:bg-gray-800 p-2 rounded-xl w-10 h-10 flex items-center justify-center">
          {icon}
        </div>

        <div className="font-semibold">{title}</div>
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-400">{description}</div>
    </div>
  );
}
