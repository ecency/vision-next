import React, { useEffect, useMemo, useState } from "react";
import dayjs from "@/utils/dayjs";
import * as ls from "@/utils/local-storage";
import { Announcement, LaterAnnouncement } from "./types";
import "./index.scss";
import { Button } from "@ui/button";
import { usePathname } from "next/navigation";
import { closeSvg } from "@ui/svg";
import Link from "next/link";
import i18next from "i18next";
import { getAnnouncementsQuery } from "@/api/queries";
import { useActiveAccount } from "@/core/hooks/use-active-account";

export const Announcements = () => {
  const { activeUser } = useActiveAccount();

  const pathname = usePathname();

  const { data: allAnnouncements } = getAnnouncementsQuery().useClientQuery();

  const [show, setShow] = useState(true);
  const [list, setList] = useState<Announcement[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [currentAnnouncement, setCurrentAnnouncement] = useState<Announcement[]>([]);

  const superList = useMemo(() => {
    const data = (allAnnouncements ?? [])
      .filter((announcement) => (announcement.auth ? !!activeUser : true))
      .filter((announcement) => {
        if (typeof announcement.path === "object") {
          return announcement.path.some((aPath) => pathname?.match(aPath));
        }
        return pathname?.match(announcement.path);
      });

    const dismissList: number[] = ls.get("dismiss_announcements");
    const laterList: LaterAnnouncement[] = ls.get("later_announcements_detail");
    const displayList: Announcement[] = [];

    data
      .filter((announcement) => !(dismissList !== null && dismissList.includes(announcement.id)))
      .forEach((announcement) => {
        if (laterList) {
          const filteredAnnouncement: LaterAnnouncement[] = laterList.filter(
            (a) => a.id == announcement.id
          );

          if (filteredAnnouncement[0] !== undefined) {
            let pastDateTime = filteredAnnouncement[0].dateTime;
            const past = dayjs(pastDateTime);
            const now = dayjs();
            const hours = now.diff(past, "hour");

            if (hours >= 24) {
              let i = 0;
              for (const item of laterList) {
                if (item.id === announcement.id) {
                  laterList.splice(i, 1);
                  i++;
                }
              }
              ls.set("later_announcements_detail", laterList);
              displayList.push(announcement);
            }
          } else {
            displayList.push(announcement);
          }
        } else {
          displayList.push(announcement);
        }
      });

    return displayList;
  }, [activeUser, allAnnouncements, pathname]);

  useEffect(() => {
    setList(superList);
    setActiveIndex(0);
  }, [superList]);

  useEffect(() => {
    if (!list.length) {
      setCurrentAnnouncement([]);
      return;
    }

    const safeIndex = Math.min(activeIndex, list.length - 1);

    if (safeIndex !== activeIndex) {
      setActiveIndex(safeIndex);
      return;
    }

    setCurrentAnnouncement([list[safeIndex]]);
  }, [activeIndex, list]);

  const closeClick = () => {
    setShow(false);
  };

  const upClick = () => {
    if (!list.length) {
      return;
    }

    setActiveIndex((previous) => (previous + 1) % list.length);
  };

  const dismissClick = () => {
    if (!list.length) {
      return;
    }

    const clickedBanner = list[activeIndex];
    const newList = list.filter((x) => x.id !== clickedBanner.id);
    setList(newList);
    setActiveIndex((previous) => Math.max(Math.min(previous, newList.length - 1), 0));
    const data = ls.get("dismiss_announcements");
    if (data === null) {
      ls.set("dismiss_announcements", [clickedBanner.id]);
    } else {
      const getCurrentData = ls.get("dismiss_announcements");
      for (let i = 0; i < getCurrentData.length; i++) {
        if (getCurrentData[i].id === clickedBanner.id) {
          return;
        }
      }
      getCurrentData.push(clickedBanner.id);
      ls.set("dismiss_announcements", getCurrentData);
    }
  };

  const laterClick = () => {
    if (!list.length) {
      return;
    }

    const clickedBanner = list[activeIndex];
    const newList = list.filter((x) => x.id !== clickedBanner.id);
    setList(newList);
    setActiveIndex((previous) => Math.max(Math.min(previous, newList.length - 1), 0));
    const DateTime = dayjs();
    const laterAnnouncementDetail = ls.get("later_announcements_detail");
    if (laterAnnouncementDetail === null) {
      ls.set("later_announcements_detail", [{ id: clickedBanner.id, dateTime: DateTime }]);
    } else {
      const getCurrentAnnouncementsDetail = ls.get("later_announcements_detail");
      for (let i = 0; i < getCurrentAnnouncementsDetail.length; i++) {
        if (getCurrentAnnouncementsDetail[i].id === clickedBanner.id) {
          ls.set("later_announcements_detail", [
            { id: clickedBanner.id, dateTime: DateTime }
          ]);
        }
      }
      getCurrentAnnouncementsDetail.push({ id: clickedBanner.id, dateTime: DateTime });
      ls.set("later_announcements_detail", getCurrentAnnouncementsDetail);
    }
  };

  return (
    <>
      {show && currentAnnouncement.length > 0 ? (
        list.length > 0 &&
        currentAnnouncement.map((x, i) => {
          return (
            <div className="announcement-container" key={i}>
              <div className="feedback-announcement">
                <div className="flex flex-col gap-3 justify-center">
                  <div className="main">
                    <div className="announcement-title">
                      <p>{x?.title}</p>
                    </div>
                  </div>
                  <div className="announcement-message">
                    <p>{x?.description}</p>
                  </div>
                  <div className="flex actions">
                    <Link href={x?.button_link ?? "/"} onClick={dismissClick}>
                      <Button>{x?.button_text}</Button>
                    </Link>
                    <Button onClick={laterClick} appearance="primary" outline={true}>
                      {i18next.t("announcements.later")}
                    </Button>
                    {list.length > 1 ? (
                      <Button onClick={upClick} appearance="link">
                        {i18next.t("announcements.next")}
                      </Button>
                    ) : (
                      <></>
                    )}
                  </div>
                  <Button
                    className="close-btn"
                    appearance="link"
                    onClick={() => {
                      closeClick();
                      dismissClick();
                    }}
                  >
                    {closeSvg}
                  </Button>
                </div>
              </div>
            </div>
          );
        })
      ) : (
        <></>
      )}
    </>
  );
};
