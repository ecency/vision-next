import i18next from "i18next";
import { useMemo } from "react";
import { useGetStatsQuery } from "@/api/queries";
import { AnimatePresence, motion } from "framer-motion";

interface Props {
  totalViews: number;
  cleanedPathname: string;
}

export function EntryPageStatsByReferrers({ totalViews, cleanedPathname }: Props) {
  const { data: stats } = useGetStatsQuery({
    url: cleanedPathname,
    dimensions: ["visit:source"]
  }).useClientQuery();
  const referrers = useMemo(
    () =>
      stats?.results?.reduce<Record<string, number>>((acc, result) => {
        const country = result.dimensions[0];
        const views = +result.metrics[1];
        return { ...acc, [country]: (acc[country] ?? 0) + views };
      }, {}) ?? {},
    [stats?.results]
  );
  const referrersList = useMemo(
    () => Object.entries(referrers).sort((a, b) => b[1] - a[1]),
    [referrers]
  );

  return referrersList.length > 0 ? (
    <div className="flex flex-col w-full gap-2 text-sm">
      <div className="text-sm opacity-50 pb-2">{i18next.t("entry.stats.referrers")}</div>
      <AnimatePresence mode="popLayout">
        {referrersList.map(([referrer, views]) => (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-md overflow-hidden relative w-full flex items-center justify-between bg-gray-100 dark:bg-gray-900"
            key={referrer}
            transition={{ delay: 0.2 }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(views * 100) / totalViews}%` }}
              transition={{ delay: 0.3 }}
              className="absolute h-full bg-gray-200 dark:bg-dark-default"
            />
            <div className="relative pl-2 py-1">{referrer}</div>
            <div className="relative pr-2 text-blue-dark-sky font-semibold">{views}</div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  ) : (
    <></>
  );
}
