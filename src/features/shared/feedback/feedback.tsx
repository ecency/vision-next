"use client";

import { FeedbackMessage } from "./feedback-message";
import { FeedbackObject } from "./feedback-events";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useMemo } from "react";
import { useMount, useSet, useUnmount } from "react-use";
import "./_index.scss";

export function Feedback() {
  const [set, { add, remove }] = useSet(new Set<FeedbackObject>());
  const queue = useMemo(() => Array.from(set), [set]);

  const onFeedback = useCallback(
    (e: Event) => add((e as CustomEvent).detail as FeedbackObject),
    [add]
  );

  useMount(() => window.addEventListener("ecency-feedback", onFeedback));
  useUnmount(() => window.removeEventListener("ecency-feedback", onFeedback));
  return (
    <div className="feedback-container">
      <AnimatePresence>
        {queue.map((item) => (
          <motion.div
            initial={{ y: 48, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ opacity: 0, height: 0 }}
            key={item.id}
          >
            <FeedbackMessage feedback={item} onClose={() => remove(item)} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
