"use client";

import React, { cloneElement, ReactElement } from "react";
import { Entry } from "@/entities";
import { PopoverConfirm } from "@/features/ui";
import { useDeleteComment } from "@/api/mutations";
import { useRouter } from "next/navigation";

interface Props {
  children: ReactElement & { className?: string };
  entry: Entry;
  parent?: Entry;
  onSuccess?: () => void;
  setDeleteInProgress?: (value: boolean) => void;
  isComment?: boolean;
}
export function EntryDeleteBtn({ children, entry, parent }: Props) {
  const router = useRouter();
  const { mutateAsync: deleteAction, isPending } = useDeleteComment(
    entry,
    () => router.push("/"),
    parent
  );

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
