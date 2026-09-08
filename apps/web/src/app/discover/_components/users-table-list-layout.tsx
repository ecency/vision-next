import { PropsWithChildren } from "react";

export function UsersTableListLayout(props: PropsWithChildren) {
  return (
    <div className="min-w-0 border reading-surface border-[--border-color] rounded-2xl p-4 max-h-[90vh] overflow-y-auto">
      {props.children}
    </div>
  );
}
