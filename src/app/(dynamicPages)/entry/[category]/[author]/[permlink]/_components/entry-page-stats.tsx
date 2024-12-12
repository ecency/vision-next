"use client";

import { usePathname } from "next/navigation";
import { useGetStatsQuery } from "@/api/queries";
import { UilEye } from "@tooni/iconscout-unicons-react";

export function EntryPageStats() {
  const pathname = usePathname();

  const { data: stats } = useGetStatsQuery(pathname).useClientQuery();

  return (
    <div className="flex items-center gap-2 text-sm opacity-50">
      <UilEye className="w-5 h-5" />
      <div>{stats?.results[0]?.metrics[1] ?? 0}</div>
    </div>
  );
}
