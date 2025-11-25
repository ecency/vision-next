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

/**
 * Renders an emoji picker dialog.
 *
 * @param {Props} anchor - The anchor element to position the picker relative to.
 * @param {function} onSelect - The callback function to be called when an emoji is selected.
 * @param position
 * @return The rendered emoji picker dialog.
 */
export function EmojiPicker({ anchor, onSelect, position, isDisabled }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  const theme = useGlobalStore((state) => state.theme);

  const [show, setShow] = useState(false);
  const [pickerPosition, setPickerPosition] = useState<{ top: number; left: number } | null>(null);

  // Due to ability to hold multiple dialogs we have to identify them
  const dialogId = useMemo(() => v4(), []);

  useClickAway(ref, () => {
    setShow(false);
  });

  const isMounted = useMountedState();

  useEffect(() => {
    if (!anchor) return;

    const handleClick = () => {
      setShow((prev) => !prev);
      if (anchor) {
        const rect = anchor.getBoundingClientRect();
        setPickerPosition({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX });
      }
    };

    anchor.addEventListener("click", handleClick);

    return () => {
      anchor.removeEventListener("click", handleClick);
    };
  }, [anchor]);

  return isMounted() ? (
    <div
      ref={ref}
      id={dialogId}
      key={dialogId}
      className={classNameObject({
        "emoji-picker-dialog": true,
        "top-[100%]": (position ?? "bottom") === "bottom",
        "bottom-[100%] right-0": position === "top"
      })}
      style={{
        display: show ? "block" : "none",
        position: "fixed",
        top: pickerPosition?.top,
        left: pickerPosition?.left
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
  ) : (
    <></>
  );
}
