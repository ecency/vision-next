"use client";

import { useGlobalStore } from "@/core/global-store";
import { ListStyle } from "@/enums";
import { EntryListLoadingItem } from "@/features/shared/entry-list-loading-item";
import { LinearProgress } from "@/features/shared/linear-progress";

export function ReadingListLoading({ showProgress = false }: { showProgress?: boolean }) {
  const listStyle = useGlobalStore((state) => state.listStyle);

  return (
    <div className="entry-list">
      <div className={`entry-list-body ${listStyle === ListStyle.grid ? "grid-view" : ""}`}>
        {showProgress && <LinearProgress />}
        <EntryListLoadingItem />
      </div>
    </div>
  );
}
