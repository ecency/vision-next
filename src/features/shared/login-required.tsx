import { cloneElement, PropsWithChildren, ReactElement } from "react";
import { useGlobalStore } from "@/core/global-store";
import { useClientActiveUser } from "@/api/queries";

export function LoginRequired({ children }: PropsWithChildren) {
  const activeUser = useClientActiveUser();
  const toggleUiProp = useGlobalStore((state) => state.toggleUiProp);

  return activeUser
    ? children
    : cloneElement(children as ReactElement, {
        onClick: () => toggleUiProp("login")
      });
}
