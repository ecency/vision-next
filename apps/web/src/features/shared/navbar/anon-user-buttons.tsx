import { Button } from "@ui/button";
import React from "react";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { useGlobalStore } from "@/core/global-store";
import i18next from "i18next";
import { preloadLoginDialog } from "@/features/shared";

export function AnonUserButtons() {
  const { activeUser } = useActiveAccount();
  const toggleUIProp = useGlobalStore((state) => state.toggleUiProp);

  return activeUser ? (
    <></>
  ) : (
    <div className="login-required flex ml-2 gap-2">
      {/* Login is the secondary action (outline); Signup is the primary CTA
          (solid) so the conversion path is visually emphasized for new visitors. */}
      <Button
        className="btn-login"
        outline={true}
        onClick={() => toggleUIProp("login")}
        onMouseEnter={preloadLoginDialog}
        onFocus={preloadLoginDialog}
        onPointerDown={preloadLoginDialog}
      >
        {i18next.t("g.login")}
      </Button>

      <Button href="/signup" className="flex items-center justify-center">
        {i18next.t("g.signup")}
      </Button>
    </div>
  );
}
