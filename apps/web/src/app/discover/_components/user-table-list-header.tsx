import { PropsWithChildren } from "react";

export function UserTableListHeader({ children }: PropsWithChildren) {
  return <div className="flex items-center justify-end gap-4 p-4">{children}</div>;
}
