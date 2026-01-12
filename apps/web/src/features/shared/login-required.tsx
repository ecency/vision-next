import { cloneElement, PropsWithChildren, ReactElement } from "react";
import { useGlobalStore } from "@/core/global-store";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { Button } from "@ui/button";

export function LoginRequired({ children }: PropsWithChildren) {
  const { activeUser } = useActiveAccount();
  const toggleUiProp = useGlobalStore((state) => state.toggleUiProp);

  if (activeUser) {
    return <>{children}</>;
  }

  if (!children) {
    return (
      <Button onClick={() => toggleUiProp("login")}>Login to continue</Button>
    );
  }

  return cloneElement(children as ReactElement, {
    onClick: () => toggleUiProp("login")
  });
}
