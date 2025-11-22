import { cloneElement, PropsWithChildren, ReactElement } from "react";
import { useGlobalStore } from "@/core/global-store";
import { useClientActiveUser } from "@/api/queries";

export function LoginRequired({ children }: PropsWithChildren) {
  const activeUser = useClientActiveUser();
  const toggleUiProp = useGlobalStore((state) => state.toggleUiProp);

  if (activeUser) {
    return <>{children}</>;
  }

  if (!children) {
    return (
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => toggleUiProp("login")}
      >
        Login to continue
      </button>
    );
  }

  return cloneElement(children as ReactElement, {
    onClick: () => toggleUiProp("login")
  });
}
