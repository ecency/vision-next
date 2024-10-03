import React from "react";
import { getAnnouncementsQuery } from "@/api/queries";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/features/ui";

export function CenterAnnouncements() {
  const { data: allAnnouncements } = getAnnouncementsQuery().useClientQuery();

  return (
    <div className="flex flex-col gap-4 p-4 max-h-[50dvh] overflow-y-auto">
      {allAnnouncements?.map((x, i) => (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="bg-gray-100 dark:bg-gray-900 rounded-2xl p-4"
          key={i}
        >
          <div className="flex flex-col gap-3 justify-center">
            <div className="announcement-title">{x?.title}</div>
            <div className="announcement-message">{x?.description}</div>
            <div className="flex actions">
              <Link href={x?.button_link ?? "/"}>
                <Button size="sm">{x?.button_text}</Button>
              </Link>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
