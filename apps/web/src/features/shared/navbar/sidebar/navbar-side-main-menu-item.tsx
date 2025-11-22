import React, { ReactNode } from "react";
import Link from "next/link";
import { Badge } from "@ui/badge";

interface Props {
  label: string;
  icon?: ReactNode;
  onClick?: () => unknown;
  to?: string;
  isNew?: boolean;
  target?: string;
  onPointerEnter?: () => void;
  onPointerDown?: () => void;
  onFocus?: () => void;
  badgeContent?: ReactNode;
  dot?: boolean;
}

export function NavbarSideMainMenuItem({
  label,
  onClick,
  icon,
  to,
  isNew,
  target,
  onPointerEnter,
  onPointerDown,
  onFocus,
  badgeContent,
  dot
}: Props) {
  const content = (
    <>
      {icon}
      <span className="flex-1">{label}</span>
      {badgeContent && (
        <span className="ml-auto inline-flex min-w-[20px] justify-center rounded-full bg-blue-500 px-2 py-0.5 text-[11px] font-semibold text-white">
          {badgeContent}
        </span>
      )}
      {!badgeContent && dot && (
        <span className="ml-auto h-2.5 w-2.5 rounded-full bg-blue-500" aria-hidden="true" />
      )}
      {isNew && <Badge className="text-xs">New 🔥</Badge>}
    </>
  );

  return to ? (
    <Link
      href={to}
      target={target}
      className="text-gray-600 flex items-center gap-2 px-3 rounded-xl py-1.5 hover:bg-gray-200 dark:hover:bg-gray-900 cursor-pointer dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 after:!hidden"
      key={label}
      onClick={onClick}
      onPointerEnter={onPointerEnter}
      onPointerDown={onPointerDown}
      onFocus={onFocus}
    >
      {content}
    </Link>
  ) : (
    <div
      className="text-gray-600 flex items-center gap-2 px-3 rounded-xl py-1.5 hover:bg-gray-200 dark:hover:bg-gray-900 cursor-pointer dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
      key={label}
      onClick={onClick}
      onPointerEnter={onPointerEnter}
      onPointerDown={onPointerDown}
      onFocus={onFocus}
    >
      {content}
    </div>
  );
}
