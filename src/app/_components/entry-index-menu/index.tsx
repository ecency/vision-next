"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { EntryIndexMenuDropdown } from "../entry-index-menu-dropdown";
import "./_index.scss";
import { ListStyleToggle } from "@/features/shared";
import { chevronDownSvgForSlider, kebabMenuHorizontalSvg, menuDownSvg } from "@ui/svg";
import Link from "next/link";
import { Introduction } from "@/app/_components/introduction";
import i18next from "i18next";
import { useGlobalStore } from "@/core/global-store";
import { apiBase } from "@/api/helper";
import { Dropdown, DropdownItem, DropdownMenu, DropdownToggle, MenuItem } from "@ui/dropdown";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import useMount from "react-use/lib/useMount";
import * as ls from "@/utils/local-storage";
import usePrevious from "react-use/lib/usePrevious";
import { Button } from "@ui/button";
import { classNameObject } from "@ui/util";
import { UilInfoCircle } from "@tooni/iconscout-unicons-react";
import { useFeedMenu } from "@/app/_components/entry-index-menu/use-feed-menu";

export enum IntroductionType {
  FRIENDS = "FRIENDS",
  TRENDING = "TRENDING",
  HOT = "HOT",
  NEW = "NEW",
  NONE = "NONE"
}

export function EntryIndexMenu() {
  const router = useRouter();
  const params = useParams<{ sections: string[] }>();
  let filter = "hot";
  let tag = "";

  if (params && params.sections) {
    [filter = "hot", tag = ""] = params.sections;
  }
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeUser = useGlobalStore((s) => s.activeUser);
  const canUseWebp = useGlobalStore((s) => s.canUseWebp);

  const [isGlobal, setIsGlobal] = useState(false);
  const [introduction, setIntroduction] = useState(IntroductionType.NONE);

  const prevActiveUser = usePrevious(activeUser);
  const prevFilter = usePrevious(filter);

  const [menuItems, secondaryMenu, isMy] = useFeedMenu();

  const noReblog = useMemo(() => searchParams?.get("no-reblog") == "true", [searchParams]);

  const dropdownLabel = useMemo(
    () =>
      isMy && filter === "feed"
        ? i18next.t("entry-filter.filter-feed-friends")
        : i18next.t(`entry-filter.filter-${filter}`),
    [filter, isMy]
  );

  const introductionOverlayClass =
    introduction === IntroductionType.NONE ? "hidden" : "overlay-for-introduction";
  const mobileItems: MenuItem[] = [...menuItems, ...secondaryMenu];

  const onChangeGlobal = (value: string) => {
    setIsGlobal(value === "global");
    if (value === "my") {
      router.push(`/${filter}/my`);
    } else if (value === "global") {
      router.push(`/${filter}/global`);
    } else {
      router.push(`/${filter}/${value}`);
    }
  };

  const getPopupTitle = () => {
    let value = "";
    switch (introduction) {
      case IntroductionType.TRENDING:
        value = "filter-trending";
        break;
      case IntroductionType.HOT:
        value = "filter-hot";
        break;
      case IntroductionType.NEW:
        value = "filter-created";
        break;
      case IntroductionType.FRIENDS:
        value = "filter-feed-friends";
        break;
      default:
        break;
    }
    return i18next.t(`entry-filter.${value}`);
  };

  const onPreviousWeb = () => {
    let value = introduction;
    switch (value) {
      case IntroductionType.NEW:
        value = IntroductionType.HOT;
        break;
      case IntroductionType.HOT:
        value = IntroductionType.TRENDING;
        break;
      case IntroductionType.TRENDING:
        value = !!activeUser ? IntroductionType.FRIENDS : IntroductionType.NONE;
        break;
      default:
        break;
    }
    setIntroduction(value);
  };

  const onNextMobile = () => {
    let value = introduction;
    switch (value) {
      case IntroductionType.TRENDING:
        value = IntroductionType.HOT;
        break;
      case IntroductionType.HOT:
        value = IntroductionType.NEW;
        break;
      case IntroductionType.FRIENDS:
        value = IntroductionType.TRENDING;
        break;
      case IntroductionType.NEW:
        value = IntroductionType.NONE;
        break;
      default:
        break;
    }
    setIntroduction(value);
  };

  const onNextWeb = () => {
    let value = introduction;
    switch (value) {
      case IntroductionType.TRENDING:
        value = IntroductionType.HOT;
        break;
      case IntroductionType.HOT:
        value = IntroductionType.NEW;
        break;
      case IntroductionType.NEW:
        value = IntroductionType.NONE;
        break;
      default:
        break;
    }
    setIntroduction(value);
  };

  const onClosePopup = () => setIntroduction(IntroductionType.NONE);

  const onPreviousMobile = () => {
    let value = introduction;
    switch (value) {
      case IntroductionType.NEW:
        value = IntroductionType.HOT;
        break;
      case IntroductionType.HOT:
        value = IntroductionType.TRENDING;
        break;
      case IntroductionType.TRENDING:
        value = !!activeUser ? IntroductionType.FRIENDS : IntroductionType.NONE;
        break;
      case IntroductionType.FRIENDS:
        value = IntroductionType.NONE;
        break;
      default:
        break;
    }
    setIntroduction(value);
  };

  const introductionDescription = (
    <>
      {i18next.t("entry-filter.filter-global-part1")}
      <span className="text-capitalize">{i18next.t(`${getPopupTitle()}`)}</span>
      {introduction === IntroductionType.FRIENDS && i18next.t("entry-filter.filter-global-part4")}
      {introduction === IntroductionType.FRIENDS && (
        <Link className="text-blue-dark-sky" href="/discover">
          {" "}
          {i18next.t("entry-filter.filter-global-discover")}
        </Link>
      )}
      {isGlobal &&
        introduction !== IntroductionType.FRIENDS &&
        i18next.t("entry-filter.filter-global-part2")}
      {!isGlobal &&
        introduction !== IntroductionType.FRIENDS &&
        i18next.t("entry-filter.filter-global-part3")}
      {!isGlobal && introduction !== IntroductionType.FRIENDS && (
        <Link className="text-blue-dark-sky" href="/communities">
          {" "}
          {i18next.t("entry-filter.filter-global-join-communities")}
        </Link>
      )}
    </>
  );

  useMount(() => {
    let isGlobal = !pathname?.includes("/my");
    if (!!activeUser && pathname?.includes(activeUser.username)) {
      isGlobal = false;
    }
    let showInitialIntroductionJourney =
      !!activeUser && ls.get(`${ls.PREFIX}_${activeUser.username}HadTutorial`);
    if (
      !!activeUser &&
      (showInitialIntroductionJourney === "false" || showInitialIntroductionJourney === null)
    ) {
      showInitialIntroductionJourney = true;
      ls.set(`${ls.PREFIX}_${activeUser.username}HadTutorial`, "true");
    }
    if (showInitialIntroductionJourney === true) {
      showInitialIntroductionJourney = IntroductionType.FRIENDS;
    } else {
      showInitialIntroductionJourney = IntroductionType.NONE;
    }
    setIsGlobal(isGlobal);
    setIntroduction(showInitialIntroductionJourney);
  });

  useEffect(() => {
    if (pathname?.includes("/my") && !activeUser) {
      router.push(pathname.replace("/my", ""));
    } else if (!prevActiveUser && activeUser && filter !== "feed") {
      let isGlobalValue = !(tag.length > 0 && tag === "my");
      setIsGlobal(isGlobalValue);
    } else if (
      prevActiveUser &&
      activeUser &&
      prevActiveUser?.username !== activeUser?.username &&
      filter === "feed"
    ) {
      router.push(`/@${activeUser?.username}/${filter}`);
    } else if (
      ["controversial", "rising"].includes(prevFilter as string) &&
      !["controversial", "rising"].includes(filter)
    ) {
      if (tag && tag.includes("@")) {
        router.push(`/${tag}/${filter}`);
      } else {
        router.push(`/${filter}`);
      }
    } else if (["controversial", "rising"].includes(filter)) {
      const tagValue =
        tag && tag !== "my" && ["week", "month", "year", "all"].includes(tag) ? "/" + tag : "/week";
      router.push(`/${filter}${tagValue}`);
    }
  }, [activeUser, filter, pathname, prevActiveUser, prevFilter, router, tag]);

  useEffect(() => {
    let showInitialIntroductionJourney =
      !!activeUser && ls.get(`${ls.PREFIX}_${activeUser.username}HadTutorial`);
    if (
      prevActiveUser !== activeUser &&
      !!activeUser &&
      (showInitialIntroductionJourney === "false" || showInitialIntroductionJourney === null)
    ) {
      showInitialIntroductionJourney = true;
      ls.set(`${ls.PREFIX}_${activeUser.username}HadTutorial`, "true");
      setIntroduction(
        showInitialIntroductionJourney ? IntroductionType.FRIENDS : IntroductionType.NONE
      );
    }
    if (
      prevActiveUser !== activeUser &&
      !activeUser &&
      ls.get(`${ls.PREFIX}_${prevActiveUser?.username}HadTutorial`)
    ) {
      setIntroduction(IntroductionType.NONE);
    }
  }, [activeUser, prevActiveUser]);

  const handleFilterReblog = useCallback(() => {
    const params = new URLSearchParams();
    params.set("no-reblog", String(!noReblog));

    router.push(pathname + "?" + params.toString());
  }, [noReblog, pathname, router]);

  return (
    <div>
      {/* <div className={introductionOverlayClass} id="overlay" onClick={onClosePopup} /> */}
      <div className="entry-index-menu flex items-center justify-center md:justify-between py-3.5 border-b dark:border-dark-200">
        <div className="bg-gray-100 dark:bg-gray-900 rounded-3xl lg:px-4 p-2 text-sm flex flex-col-reverse items-center md:flex-row">
          <div className="flex items-center">
            <div className="main-menu justify-center hidden lg:flex md:mb-0 md:items-center">
              <div className="block md:hidden relative">
                <Dropdown>
                  <DropdownToggle>
                    <Button size="sm" icon={chevronDownSvgForSlider} appearance="gray-link">
                      {dropdownLabel}
                    </Button>
                  </DropdownToggle>
                  <DropdownMenu align="left">
                    {menuItems.map((item, i) => (
                      <DropdownItem key={i} onClick={item.onClick}>
                        {item.label}
                      </DropdownItem>
                    ))}
                  </DropdownMenu>
                </Dropdown>
              </div>
              <div className="hidden lg:block">
                <ul className="flex flex-wrap mb-0">
                  {menuItems.map((i, k) => (
                    <li key={k}>
                      <Link
                        href={i.href!}
                        className={classNameObject({
                          "text-gray-steel hover:text-blue-dark-sky rounded-full flex items-center px-3 py-1.5":
                            true,
                          "bg-blue-dark-sky text-white hover:text-white":
                            i.selected && introduction === IntroductionType.NONE && i.selected,
                          [`link-${i.id}`]: true
                        })}
                        id={i.id}
                      >
                        {i.label}
                      </Link>
                    </li>
                  ))}
                  {/* {introduction !== IntroductionType.NONE &&
                  introduction !== IntroductionType.FRIENDS &&
                  (introduction === IntroductionType.HOT ||
                    introduction === IntroductionType.TRENDING ||
                    introduction === IntroductionType.NEW) ? (
                    <Introduction
                      title={getPopupTitle()}
                      media={apiBase(`/assets/our-vision.${canUseWebp ? "webp" : "png"}`)}
                      placement={
                        introduction === IntroductionType.TRENDING
                          ? "20%"
                          : introduction === IntroductionType.HOT
                            ? "25%"
                            : "30%"
                      }
                      onNext={onNextWeb}
                      onPrevious={onPreviousWeb}
                      onClose={onClosePopup}
                      description={introductionDescription}
                      showFinish={introduction === IntroductionType.NEW}
                    />
                  ) : null} */}
                </ul>
              </div>
              <div className="kebab-icon flex">
                <Dropdown>
                  <DropdownToggle>
                    <Button size="sm" appearance="gray-link" icon={kebabMenuHorizontalSvg} />
                  </DropdownToggle>
                  <DropdownMenu align="left">
                    {secondaryMenu.map((item, i) => (
                        <DropdownItem key={i} href={item.href} selected={item.selected}>
                          {item.label}
                        </DropdownItem>
                    ))}
                  </DropdownMenu>
                </Dropdown>
              </div>
            </div>

            <div className="main-menu justify-center flex lg:hidden md:mb-0 md:items-center">
              <div className="lg:hidden relative">
                <Dropdown>
                  <DropdownToggle>
                    <Button size="sm" icon={menuDownSvg} appearance="gray-link">
                      {dropdownLabel}
                    </Button>
                  </DropdownToggle>
                  <DropdownMenu align="left">
                    {mobileItems.map((item, i) => (
                      <DropdownItem selected={item.selected} key={i} onClick={item.onClick}>
                        {item.label}
                      </DropdownItem>
                    ))}
                  </DropdownMenu>
                </Dropdown>
                {/* {introduction !== IntroductionType.NONE ? (
                  <Introduction
                    title={getPopupTitle()}
                    media={apiBase(`/assets/our-vision.${canUseWebp ? "webp" : "png"}`)}
                    onNext={onNextMobile}
                    onPrevious={onPreviousMobile}
                    onClose={onClosePopup}
                    description={introductionDescription}
                    showFinish={introduction === IntroductionType.NEW}
                  />
                ) : (
                  <></>
                )} */}
              </div>
              <div className="hidden lg:block">
                <ul className="flex flex-wrap">
                  {mobileItems.map((i, k) => (
                      <DropdownItem
                          key={k}
                          href={i.href}
                          selected={i.selected}
                          className={classNameObject({
                            "text-gray-steel hover:text-blue-dark-sky rounded-full flex items-center px-3 py-1.5": true,
                            "bg-blue-dark-sky text-white hover:text-white": i.selected,
                            [`link-${i.id}`]: true
                          })}
                      >
                        {i.label}
                      </DropdownItem>
                  ))}
                </ul>
              </div>
            </div>
            {filter !== "feed" ? (
              <>
                <div className="border-l border-[--border-color] ml-3 dropDown-left-border-height" />
                <span id="check-isGlobal" className="flex items-center pl-3">
                  <EntryIndexMenuDropdown
                    filter={filter}
                    tag={tag}
                    noReblog={noReblog!!}
                    handleFilterReblog={handleFilterReblog}
                    onChangeGlobal={onChangeGlobal}
                  />
                </span>
              </>
            ) : (
              <>
                <div className="border-l border-[--border-color] ml-3 dropDown-left-border-height" />
                <span id="check-isGlobal" className="flex items-center pl-3">
                  <EntryIndexMenuDropdown
                    filter={filter}
                    tag={tag}
                    noReblog={noReblog!!}
                    handleFilterReblog={handleFilterReblog}
                    onChangeGlobal={onChangeGlobal}
                  />
                </span>
              </>
            )}
          </div>
        </div>
        {/* <div className="flex items-center ml-auto md:ml-0 pl-3">
          <Button
            size="sm"
            appearance="gray-link"
            icon={<UilInfoCircle />}
            onClick={() =>
              setIntroduction(
                filter === "feed"
                  ? IntroductionType.FRIENDS
                  : filter === "trending"
                    ? IntroductionType.TRENDING
                    : filter === "hot"
                      ? IntroductionType.HOT
                      : filter === "created"
                        ? IntroductionType.NEW
                        : IntroductionType.NONE
              )
            }
          />
          <ListStyleToggle />
        </div> */}
      </div>
    </div>
  );
}
