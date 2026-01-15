import { getStatsQueryOptions } from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import i18next from "i18next";
import { useMemo } from "react";

interface Props {
  totalViews: number;
  cleanedPathname: string;
}

export function EntryPageStatsByDevices({ totalViews, cleanedPathname }: Props) {
  const { data: stats } = useQuery(
    getStatsQueryOptions({
      url: cleanedPathname,
      dimensions: ["visit:device"]
    })
  );

  const devices = useMemo(
    () =>
      stats?.results?.reduce<Record<string, number>>((acc, result) => {
        const country = result.dimensions[0];
        const views = +result.metrics[1];
        return { ...acc, [country]: (acc[country] ?? 0) + views };
      }, {}) ?? {},
    [stats?.results]
  );
  const devicesList = useMemo(() => Object.entries(devices).sort((a, b) => b[1] - a[1]), [devices]);

  return devicesList.length > 0 ? (
    <div className="flex flex-col w-full gap-2 text-sm">
      <div className="text-sm opacity-50 pb-2">{i18next.t("entry.stats.devices")}</div>
      <AnimatePresence mode="popLayout">
        {devicesList.map(([country, views]) => (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-md overflow-hidden relative w-full flex items-center justify-between bg-gray-100 dark:bg-gray-900"
            key={country}
            transition={{ delay: 0.2 }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(views * 100) / totalViews}%` }}
              transition={{ delay: 0.3 }}
              className="absolute h-full bg-gray-200 dark:bg-dark-default"
            />
            <div className="relative pl-2 py-1">{country}</div>
            <div className="relative pr-2 text-blue-dark-sky font-semibold">{views}</div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  ) : (
    <></>
  );
}
