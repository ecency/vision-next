"use client";

import { useEffect, useRef, useState, type CSSProperties, type MutableRefObject } from "react";
import "./_index.scss";
import Picker from "@emoji-mart/react";
import emojiData from "@emoji-mart/data";
import { useGlobalStore } from "@/core/global-store";
import { classNameObject } from "@ui/util";

interface Props {
  show: boolean;
  changeState: (show: boolean) => void;
  onSelect: (e: string) => void;
  isDisabled?: boolean;
  style?: CSSProperties;
  rootRef?: MutableRefObject<HTMLDivElement | null>;
  buttonRef?: MutableRefObject<HTMLElement | null>;
  position?: "top" | "bottom";
}

const PICKER_ESTIMATED_HEIGHT = 380;
const PICKER_ESTIMATED_WIDTH = 340;

export function EmojiPicker({
  show,
  changeState,
  onSelect,
  isDisabled,
  style,
  rootRef,
  buttonRef,
  position = "bottom"
}: Props) {
  const internalRootRef = useRef<HTMLDivElement | null>(null);
  const ref = rootRef ?? internalRootRef;
  const theme = useGlobalStore((state) => state.theme);
  const [pickerPosition, setPickerPosition] = useState<{ top: number; left: number } | null>(null);

  // Calculate position when picker is shown
  useEffect(() => {
    if (!show || !buttonRef?.current) {
      return;
    }

    const rect = buttonRef.current.getBoundingClientRect();
    let top: number;
    let left: number;

    // Align the picker to the right edge of the trigger button
    const desiredLeft = rect.right - PICKER_ESTIMATED_WIDTH;

    if (position === "top") {
      top = rect.top - PICKER_ESTIMATED_HEIGHT - 8;
    } else {
      top = rect.bottom + 8;
    }

    // Clamp top so it stays on screen
    const minTop = 8;
    const maxTop = window.innerHeight - PICKER_ESTIMATED_HEIGHT - 8;
    top = Math.max(minTop, Math.min(top, maxTop));

    // Clamp left so it stays on screen
    const minLeft = 8;
    const maxLeft = window.innerWidth - PICKER_ESTIMATED_WIDTH - 8;
    left = Math.max(minLeft, Math.min(desiredLeft, maxLeft));

    setPickerPosition({ top, left });
  }, [show, buttonRef, position]);

  // Handle click outside to close picker (same pattern as GIF picker)
  useEffect(() => {
    if (!show) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const targetNode = event.target as Node | null;

      if (!targetNode) {
        return;
      }

      // Don't close if clicking inside the picker
      if (ref.current?.contains(targetNode)) {
        return;
      }

      changeState(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [show, changeState]);

  const mergedStyle: CSSProperties = {
    position: "fixed",
    top: pickerPosition?.top,
    left: pickerPosition?.left,
    zIndex: 9999,
    ...style
  };

  return (
    <div
      ref={ref}
      className={classNameObject({
        "emoji-picker-dialog": true
      })}
      style={mergedStyle}
    >
      <Picker
        data={emojiData}
        dynamicWidth={true}
        onEmojiSelect={(e: { native: string }) => {
          if (isDisabled) {
            return;
          }
          onSelect(e.native);
          changeState(false);
        }}
        previewPosition="none"
        // Render native emoji glyphs so we don't depend on sprite sheets that may not load
        set="native"
        theme={theme === "day" ? "light" : "dark"}
      />
    </div>
  );
}
