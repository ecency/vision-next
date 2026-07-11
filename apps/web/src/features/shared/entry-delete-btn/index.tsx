"use client";

import React, { cloneElement, ReactElement, useEffect } from "react";
import { Entry } from "@/entities";
import { PopoverConfirm } from "@/features/ui";
import { useDeleteComment } from "@/api/mutations";

interface Props {
  children: ReactElement & { className?: string };
  entry: Entry;
  parent?: Entry;
  onSuccess?: () => void;
  setDeleteInProgress?: (value: boolean) => void;
}
export function EntryDeleteBtn({
  children,
  entry,
  parent,
  onSuccess,
  setDeleteInProgress
}: Props) {
  // Navigation after delete is the caller's decision (via onSuccess): in a
  // discussion thread the entry simply disappears from the cached list, so
  // forcing a redirect here would yank the user off the page they're reading.
  const { mutateAsync: deleteAction, isPending } = useDeleteComment(
    entry,
    () => onSuccess?.(),
    parent
  );

  useEffect(() => {
    setDeleteInProgress?.(isPending);
    // Don't leave the caller stuck in a loading state if the button unmounts
    // mid-flight (navigation, list invalidation after a successful delete).
    return () => setDeleteInProgress?.(false);
  }, [isPending, setDeleteInProgress]);

  // Read the caller's class from children.props (ReactElement.props is typed
  // `unknown` under React 19, hence the cast). The previous code read
  // `children.className` — a field that is always undefined on a React
  // element — which silently dropped the caller's class.
  const childClassName = (children.props as { className?: string }).className;
  // Strip the exact "in-progress" token (not a raw substring, which would
  // corrupt class names like "in-progress-pill") before re-adding it.
  const baseClassName = (childClassName ?? "")
    .split(/\s+/)
    .filter((token) => token && token !== "in-progress")
    .join(" ");
  const child = cloneElement(children, {
    className: [baseClassName, isPending ? "in-progress" : ""].filter(Boolean).join(" ")
  });

  return (
    <PopoverConfirm onConfirm={isPending ? undefined : deleteAction}>{child}</PopoverConfirm>
  );
}
