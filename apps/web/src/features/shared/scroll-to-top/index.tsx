"use client";

import React, { useRef, useState } from "react";
import "./_index.scss";
import { chevronUpSvg } from "@/features/ui/svg";
import i18next from "i18next";
import { Tooltip } from "@ui/tooltip";
import { useHideOnScroll } from "@/features/shared/navbar/use-hide-on-scroll";
import clsx from "clsx";
import useMount from "react-use/lib/useMount";
import useUnmount from "react-use/lib/useUnmount";

export function ScrollToTop() {
  const timerRef = useRef<any>(undefined);
  const [visible, setVisible] = useState(false);

  // Share the bottom navbar + compose FAB's hide-on-scroll signal so the whole
  // bottom cluster moves as one: it slides away on scroll-down and returns on
  // scroll-up, keeping this control level with the FAB instead of stranded above
  // it. (No-op on desktop — the matching transform is mobile-only in the SCSS.)
  const hidden = useHideOnScroll();

  useMount(() => {
    detect();
    window.addEventListener("scroll", scrollChanged);
    window.addEventListener("resize", scrollChanged);
  });

  useUnmount(() => {
    window.removeEventListener("scroll", scrollChanged);
    window.removeEventListener("resize", scrollChanged);
    clearTimeout(timerRef.current);
  });

  const scrollChanged = () => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(detect, 5);
  };

  const detect = () => {
    setVisible(window.scrollY > window.innerHeight);
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <Tooltip content={i18next.t("scroll-to-top.title")}>
      <div
        className={clsx("scroll-to-top", visible && "visible", hidden && "navbar-hidden")}
        role="button"
        tabIndex={0}
        aria-label={i18next.t("scroll-to-top.title")}
        onClick={scrollToTop}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            scrollToTop();
          }
        }}
      >
        {chevronUpSvg}
      </div>
    </Tooltip>
  );
}
