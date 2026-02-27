import { UilBell } from "@tooni/iconscout-unicons-react";
import { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export function NotificationBadgeIcon({ children }: Props) {
  return (
    <span className="relative inline-flex">
      {children}
      <UilBell className="absolute -top-1 -right-1.5 !h-3 !w-3" />
    </span>
  );
}
