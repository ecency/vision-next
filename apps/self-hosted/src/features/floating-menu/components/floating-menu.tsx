import { useState, useCallback, memo } from "react";
import { FloatingMenuButton } from "./floating-menu-button";
import { FloatingMenuWindow } from "./floating-menu-window";

interface FloatingMenuProps {
  show?: boolean;
}

export const FloatingMenu = memo<FloatingMenuProps>(({ show = true }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  if (!show) return null;

  return (
    <>
      <FloatingMenuButton onClick={handleToggle} isOpen={isOpen} />
      <FloatingMenuWindow isOpen={isOpen} onClose={handleClose} />
    </>
  );
});

FloatingMenu.displayName = "FloatingMenu";
