"use client";

import { FeedbackMessage } from "./feedback-message";
import { FeedbackObject } from "./feedback-events";
import { useCallback, useMemo } from "react";
import { useMount, useSet, useUnmount } from "react-use";
import "./_index.scss";

// Feedback is mounted on every route, so its toast entrance must stay a pure
// CSS keyframe (see _index.scss) with zero JS on the global critical path.
// Exit animation is intentionally absent — toasts are transient and
// auto-dismiss, so popping out is acceptable.
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
