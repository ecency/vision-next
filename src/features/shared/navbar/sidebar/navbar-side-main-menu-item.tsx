import React, { ReactNode } from "react";
import Link from "next/link";
import { Badge } from "@ui/badge";

interface Props {
  label: string;
  icon?: ReactNode;
  onClick?: () => unknown;
  to?: string;
  isNew?: boolean;
}

export function NavbarSideMainMenuItem({ label, onClick, icon, to, isNew }: Props) {
  return to ? (
    <Link
      href={to}
      className="text-gray-600 flex items-center gap-2 px-3 rounded-xl py-1.5 hover:bg-gray-200 dark:hover:bg-gray-900 cursor-pointer dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
      key={label}
      onClick={onClick}
    >
      {icon}
      {label}
      {isNew && <Badge className="text-xs">New 🔥</Badge>}
    </Link>
  ) : (
    <div
      className="text-gray-600 flex items-center gap-2 px-3 rounded-xl py-1.5 hover:bg-gray-200 dark:hover:bg-gray-900 cursor-pointer dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
      key={label}
      onClick={onClick}
    >
      {icon}
      {label}
    </div>
  );
}
