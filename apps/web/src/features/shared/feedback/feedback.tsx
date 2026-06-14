"use client";

import { FeedbackMessage } from "./feedback-message";
import { FeedbackObject } from "./feedback-events";
import { useCallback, useMemo } from "react";
import { useMount, useSet, useUnmount } from "react-use";
import "./_index.scss";

// Feedback is mounted on every route. It used framer-motion purely for a
// slide-up/fade-in toast animation, which dragged the whole framer-motion
// runtime into the global critical path. A CSS keyframe (see _index.scss)
// gives the same entrance with zero JS. Exit animation is dropped — toasts are
// transient and auto-dismiss, so popping out is acceptable.
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
      {queue.map((item) => (
        <div className="feedback-item-enter" key={item.id}>
          <FeedbackMessage feedback={item} onClose={() => remove(item)} />
        </div>
      ))}
    </div>
  );
}
