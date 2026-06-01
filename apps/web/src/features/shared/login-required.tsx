import { KeyboardEvent, MouseEvent, PropsWithChildren } from "react";
import { useGlobalStore } from "@/core/global-store";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { Button } from "@ui/button";

interface Props {
  /**
   * When true, a logged-out user still SEES the gated child, but activating it
   * (click / Enter / Space) opens the login modal instead of running the real
   * action — converting intent into a login prompt rather than silently hiding
   * the control. Use for high-intent actions (vote, reply, reblog, tip, follow,
   * publish) where hiding the control loses the conversion.
   *
   * Without this prop the legacy behavior is preserved: gated children are not
   * rendered for logged-out users.
   */
  promptOnAnon?: boolean;
}

export function LoginRequired({ children, promptOnAnon = false }: PropsWithChildren<Props>) {
  const { activeUser } = useActiveAccount();
  const toggleUiProp = useGlobalStore((state) => state.toggleUiProp);

  if (activeUser) {
    // User is logged in - render children if provided, otherwise nothing
    return children ? <>{children}</> : null;
  }

  // User is not logged in
  if (!children) {
    // No children provided - show default login button
    return <Button onClick={() => toggleUiProp("login")}>Login to continue</Button>;
  }

  if (promptOnAnon) {
    // Keep the control visible, but intercept activation in the CAPTURE phase so
    // the real (protected) handler never runs — even when the click/keypress
    // lands on a nested element — and open the login modal instead. The wrapper
    // uses `display: contents` so it does not affect layout.
    // Skip editable targets so a nested input/textarea keeps typing (including
    // Space) working instead of opening the login modal.
    const isEditableTarget = (target: EventTarget | null) => {
      const el = target as HTMLElement | null;
      if (!el) return false;
      const tag = el.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
    };
    const openLogin = (e: MouseEvent | KeyboardEvent) => {
      if (isEditableTarget(e.target)) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      toggleUiProp("login");
    };
    return (
      <span
        className="contents"
        onClickCapture={openLogin}
        onKeyDownCapture={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            openLogin(e);
          }
        }}
      >
        {children}
      </span>
    );
  }

  // Has children but user not logged in - don't render protected content
  return null;
}
