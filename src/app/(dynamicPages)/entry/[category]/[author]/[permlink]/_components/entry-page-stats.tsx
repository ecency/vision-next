"use client";

import { usePathname } from "next/navigation";
import { useGetStatsQuery } from "@/api/queries";
import { UilEye, UilInfoCircle } from "@tooni/iconscout-unicons-react";
import { useMemo, useState } from "react";
import { Button } from "@ui/button";
import { Modal, ModalBody, ModalHeader } from "@ui/modal";
import i18next from "i18next";
import { Entry } from "@/entities";
import { format, parseISO } from "date-fns";
import { EntryPageStatsItem } from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/entry-page-stats-item";
import { EntryPageStatsByCountries } from "./entry-page-stats-by-countries";
import { EntryPageStatsByDevices } from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/entry-page-stats-by-devices";
import { Alert } from "@ui/alert";

interface Props {
  entry: Entry;
}

export function EntryPageStats({ entry }: Props) {
  const pathname = usePathname();
  const [showStats, setShowStats] = useState(false);

  /**
   * We have to clean pathname to get all available page-views of entry
   * As each post may be visited by different categories(URLs)
   */
  const cleanedPathname = useMemo(() => {
    const sections = pathname.split("/");
    console.log(sections);
    if (sections.length === 4) {
      return `${sections[2]}/${sections[3]}`;
    }

    return `${sections[1]}/${sections[2]}`;
  }, [pathname]);
  const createdDate = useMemo(
    () => format(parseISO(entry.created), "dd MMM yyyy"),
    [entry.created]
  );

  const { data: stats } = useGetStatsQuery(cleanedPathname).useClientQuery();

  const totalViews = useMemo(() => stats?.results?.[0].metrics[1] ?? 1, [stats?.results]);
  const totalVisitors = useMemo(() => stats?.results?.[0].metrics[0] ?? 0, [stats?.results]);
  const averageReadTime = useMemo(
    () => ((stats?.results?.[0].metrics[2] ?? 0) / totalViews).toFixed(1),
    [stats?.results, totalViews]
  );

  return (
    <>
      <Button
        noPadding={true}
        icon={<UilEye />}
        iconPlacement="left"
        size="sm"
        appearance="gray-link"
        onClick={() => setShowStats(true)}
      >
        {totalViews}
      </Button>
      <Modal size="lg" centered={true} show={showStats} onHide={() => setShowStats(false)}>
        <ModalHeader closeButton={true}>{i18next.t("entry.stats.stats-details")}</ModalHeader>
        <ModalBody className="flex flex-col gap-4 lg:gap-6">
          <div className="text-sm opacity-50 flex items-center flex-wrap gap-1.5">
            <span>
              {createdDate} – {i18next.t("g.today")}
            </span>
            <span className="w-1 h-1 bg-gray-600 dark:bg-gray-400 inline-flex rounded-full" />
            <span>{i18next.t("entry.stats.update-info")}</span>
          </div>
          <div className="grid grid-cols-3">
            <EntryPageStatsItem count={totalViews} label={i18next.t("entry.stats.views")} />
            <EntryPageStatsItem count={totalVisitors} label={i18next.t("entry.stats.visitors")} />
            <EntryPageStatsItem
              count={`${averageReadTime}s`}
              label={i18next.t("entry.stats.reads")}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <EntryPageStatsByCountries cleanedPathname={cleanedPathname} totalViews={totalViews} />
            <EntryPageStatsByDevices cleanedPathname={cleanedPathname} totalViews={totalViews} />
          </div>

          <Alert className="flex items-center gap-2 text-sm">
            <UilInfoCircle className="w-5 h-5" />
            <div>{i18next.t("entry.stats.warn")}</div>
          </Alert>
        </ModalBody>
      </Modal>
    </>
  );
}
