import { wordCounter } from "@/app/submit/_components";
import clsx from "clsx";
import { useMotionValue, useSpring } from "framer-motion";
import i18next from "i18next";
import { useEffect, useMemo, useRef } from "react";
import { usePublishState } from "../_hooks";

export function PublishEditorCounter() {
  const { content, poll } = usePublishState();

  const ref = useRef<HTMLDivElement>(null);

  const words = useMemo(() => wordCounter(content ?? ""), [content]);

  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    damping: 100,
    stiffness: 100
  });

  useEffect(() => {
    motionValue.set(words.words);
  }, [motionValue, words]);

  useEffect(
    () =>
      springValue.on("change", (latest) => {
        if (ref.current) {
          ref.current.textContent = i18next.t("word-count.label", {
            n:
              typeof Intl !== "undefined" && typeof Intl.NumberFormat === "function"
                ? Intl.NumberFormat("en-US").format(+latest.toFixed(0))
                : (+latest.toFixed(0)).toString()
          });
        }
      }),
    [springValue]
  );

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
