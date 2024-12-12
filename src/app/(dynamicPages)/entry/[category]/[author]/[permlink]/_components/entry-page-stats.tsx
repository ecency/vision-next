"use client";

import { usePathname } from "next/navigation";
import { useGetStatsQuery } from "@/api/queries";
import { UilEye } from "@tooni/iconscout-unicons-react";
import { useMemo } from "react";

export function EntryPageStats() {
  const pathname = usePathname();

  /**
   * We have to clean pathname to get all available page-views of entry
   * As each post may be visited by different categories(URLs)
   */
  const cleanedPathname = useMemo(() => {
    const sections = pathname.split("/");
    if (sections.length === 3) {
      return `${sections[1]}/${sections[2]}`;
    }

    return `${sections[0]}/${sections[1]}`;
  }, [pathname]);

  const { data: stats } = useGetStatsQuery(cleanedPathname).useClientQuery();

  return (
    <div className="flex items-center gap-2 opacity-50">
      <UilEye className="w-4 h-4" />
      <div>{stats?.results[0]?.metrics[1] ?? 0}</div>
    </div>
  );
}
