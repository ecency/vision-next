import { wordCounter } from "@/app/submit/_components";
import clsx from "clsx";
import i18next from "i18next";
import { useEffect, useMemo, useRef } from "react";
import { usePublishState } from "../_hooks";

export function PublishEditorCounter() {
  const { content, poll } = usePublishState();

  const ref = useRef<HTMLDivElement>(null);
  const displayedRef = useRef(0);

  const words = useMemo(() => wordCounter(content ?? ""), [content]);

  useEffect(() => {
    const setLabel = (value: number) => {
      displayedRef.current = value;
      if (ref.current) {
        ref.current.textContent = i18next.t("word-count.label", {
          n:
            typeof Intl !== "undefined" && typeof Intl.NumberFormat === "function"
              ? Intl.NumberFormat(i18next.language || undefined).format(value)
              : value.toString()
        });
      }
    };

    const from = displayedRef.current;
    const to = words.words;
    if (from === to) {
      setLabel(to);
      return;
    }

    const duration = 400;
    const start = performance.now();
    let frame = requestAnimationFrame(function tick(now: number) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setLabel(Math.round(from + (to - from) * eased));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    });

    return () => cancelAnimationFrame(frame);
  }, [words]);

  return (
    <div
      className={clsx(
        "sticky right-0 text-right text-sm p-2 duration-300",
        poll ? "bottom-[50px]" : "bottom-0"
      )}
    >
      <div
        ref={ref}
        className="inline-block rounded-md backdrop-blur-sm p-2 bg-white !bg-opacity-50 text-gray-600 dark:text-gray-400"
      />
    </div>
  );
}
