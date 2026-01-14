import { cloneElement, PropsWithChildren, ReactElement } from "react";
import { useGlobalStore } from "@/core/global-store";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { Button } from "@ui/button";

export function LoginRequired({ children }: PropsWithChildren) {
  const { activeUser } = useActiveAccount();
  const toggleUiProp = useGlobalStore((state) => state.toggleUiProp);

  if (activeUser) {
    // User is logged in - render children if provided, otherwise nothing
    return children ? <>{children}</> : null;
  }

  // User is not logged in
  if (!children) {
    // No children provided - show default login button
    return (
      <Button onClick={() => toggleUiProp("login")}>Login to continue</Button>
    );
  }

  // Has children but user not logged in - don't render protected content
  return null;
}
