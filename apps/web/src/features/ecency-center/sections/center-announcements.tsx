import React from "react";
import { getAnnouncementsQueryOptions } from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@/features/ui";

export function CenterAnnouncements() {
  const { data: allAnnouncements } = useQuery(getAnnouncementsQueryOptions());

  return (
    <div className="flex flex-col gap-4 p-4 max-h-[50dvh] overflow-y-auto">
      {allAnnouncements?.map((x, i) => (
        <div
          className="animate-fade-in-up bg-gray-100 dark:bg-gray-900 rounded-2xl p-4"
          style={{ animationDelay: `${Math.min(i, 5) * 50}ms` }}
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
        </div>
      ))}
    </div>
  );
}
