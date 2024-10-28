"use client";

import { ProfilePopover, UserAvatar } from "@/features/shared";
import { Entry } from "@/entities";
import { PropsWithChildren, ReactNode } from "react";
import { motion } from "framer-motion";

interface Props {
  username: string;
  i: number;
  prefix?: ReactNode;
}

export function UsersTableListItem({ username, children, i, prefix }: PropsWithChildren<Props>) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        left: -16,
        scale: 0.95
      }}
      animate={{
        opacity: 1,
        left: 0,
        scale: 1
      }}
      exit={{
        opacity: 0,
        left: -16,
        scale: 0.95
      }}
      transition={{
        delay: 0.1 * i
      }}
      className="relative bg-gray-100 dark:bg-dark-200 border border-[--border-color] rounded-2xl p-4 flex items-center justify-between gap-4"
    >
      <div className="flex items-center gap-4">
        {prefix}
        <UserAvatar size="medium" username={username} />
        <ProfilePopover entry={{ author: username } as Entry} />
      </div>
      <div className="flex items-center gap-4">{children}</div>
    </motion.div>
  );
}
