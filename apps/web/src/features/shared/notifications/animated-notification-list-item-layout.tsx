import { PropsWithChildren } from "react";

export function AnimatedNotificationListItemLayout(props: PropsWithChildren<{ index: number }>) {
  // Staggered CSS entrance; no exit choreography on purpose — list items in a
  // closing drawer previously registered with the drawer's AnimatePresence
  // exit and could block its unmount entirely (stuck sidebar until reload).
  return (
    <div
      className="animate-fade-in-up"
      style={{ animationDelay: `${Math.min(props.index, 5) * 50}ms` }}
    >
      {props.children}
    </div>
  );
}
