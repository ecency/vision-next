"use client";

import { WaveEntry } from "@/entities";
import { useMemo } from "react";
import { UserAvatar } from "@/features/shared";

interface Props {
  entries: WaveEntry[];
  onClick: () => void;
}

export function WavesRefreshPopup({ entries, onClick }: Props) {
  const authors = useMemo(
    () => Array.from(new Set(entries.map((e) => e.author))).slice(0, 3),
    [entries]
  );

  const count = entries.length;

  return (
    <div className="fixed top-[60px] md:top-[76px] left-1/2 -translate-x-1/2 z-50 flex justify-center">
      <button
        onClick={onClick}
        className="flex items-center gap-2 bg-blue-dark-sky text-white rounded-full px-4 py-2 shadow"
      >
        <div className="flex -space-x-2">
          {authors.map((a) => (
            <UserAvatar key={a} username={a} size="small" />
          ))}
        </div>
        <span className="text-sm">
          {count} new {count === 1 ? "wave" : "waves"}
        </span>
      </button>
    </div>
  );
}

