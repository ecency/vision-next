"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import useMountedState from "react-use/lib/useMountedState";
import "./_index.scss";
import { v4 } from "uuid";
import Picker from "@emoji-mart/react";
import useClickAway from "react-use/lib/useClickAway";
import { useGlobalStore } from "@/core/global-store";
import { classNameObject } from "@ui/util";

interface Props {
  anchor: Element | null;
  onSelect: (e: string) => void;
  position?: "top" | "bottom";
  isDisabled?: boolean;
}

const PICKER_ESTIMATED_HEIGHT = 380; // px, rough emoji-mart height
const PICKER_ESTIMATED_WIDTH = 340;  // px

export function EmojiPicker({ anchor, onSelect, position = "bottom", isDisabled }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const theme = useGlobalStore((state) => state.theme);

  const [show, setShow] = useState(false);
  const [pickerPosition, setPickerPosition] = useState<{ top: number; left: number } | null>(null);

  const dialogId = useMemo(() => v4(), []);
  const isMounted = useMountedState();

  useClickAway(ref, () => {
    setShow(false);
  });

  useEffect(() => {
    if (!anchor) return;

    const handleClick = () => {
      setShow((prev) => !prev);

      if (!anchor) return;

      const rect = anchor.getBoundingClientRect();

      let top: number;
      let left: number;

      // Base left so picker is roughly centered on the button
      const desiredLeft = rect.left + rect.width / 2 - PICKER_ESTIMATED_WIDTH / 2;

      if (position === "top") {
        // Put picker above the anchor
        top = rect.top + window.scrollY - PICKER_ESTIMATED_HEIGHT - 8;
      } else {
        // Put picker below the anchor
        top = rect.bottom + window.scrollY + 8;
      }

      // Clamp top so it stays on screen
      const minTop = window.scrollY + 8;
      const maxTop = window.scrollY + window.innerHeight - PICKER_ESTIMATED_HEIGHT - 8;
      top = Math.max(minTop, Math.min(top, maxTop));

      // Clamp left so it stays on screen
      const minLeft = 8;
      const maxLeft = window.innerWidth - PICKER_ESTIMATED_WIDTH - 8;
      left = Math.max(minLeft, Math.min(desiredLeft, maxLeft));

      setPickerPosition({ top, left });
    };

    anchor.addEventListener("click", handleClick);
    return () => {
      anchor.removeEventListener("click", handleClick);
    };
  }, [anchor, position]);

  if (!isMounted()) {
    return null;
  }

  return (
    <div
      ref={ref}
      id={dialogId}
      key={dialogId}
      className={classNameObject({
        "emoji-picker-dialog": true
      })}
      style={{
        display: show ? "block" : "none",
        position: "fixed",
        top: pickerPosition?.top,
        left: pickerPosition?.left,
        zIndex: 9999
      }}
    >
      <Picker
        dynamicWidth={true}
        onEmojiSelect={(e: { native: string }) => {
          if (isDisabled) {
            return;
          }
          onSelect(e.native);
          setShow(false);
        }}
        previewPosition="none"
        set="apple"
        theme={theme === "day" ? "light" : "dark"}
      />
    </div>
  );
}
