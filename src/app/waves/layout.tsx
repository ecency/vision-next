"use client";

import { Feedback, Navbar, ScrollToTop } from "@/features/shared";
import { PropsWithChildren, ReactNode, useCallback, useState } from "react";
import { classNameObject } from "@ui/util";
import { useMount, useUnmount } from "react-use";
import { TopCommunitiesWidget } from "@/app/_components/top-communities-widget";

interface Props {
  view: ReactNode;
}

export default function WavesLayout(props: PropsWithChildren<Props>) {
  const [scroll, setScroll] = useState(0);

  const handleScroll = useCallback(() => setScroll(window.scrollY), []);

  useMount(() => window.addEventListener("scroll", handleScroll));
  useUnmount(() => window.removeEventListener("scroll", handleScroll));

  return (
    <div
      className={classNameObject({
        "bg-blue-duck-egg dark:bg-dark-700 min-h-[100vh]": true,
        "[&_.ecency-navbar-desktop]:rounded-b-none": scroll <= 32
      })}
    >
      <Feedback />
      <ScrollToTop />
      <Navbar experimental={true} />
      <div className="pt-[156px] max-w-[1600px] px-4 md:px-6 lg:px-8 mx-auto grid grid-cols-12 gap-4 md:gap-6 xl:gap-8">
        <div className="col-span-3"></div>
        <div className="col-span-6">{props.children}</div>
        <div className="col-span-3">
          <div className="rounded-2xl bg-white dark:bg-dark-200 p-4 [&_.item-content]:!mr-0 [&_.top-communities-widget]:p-0 [&_.top-communities-widget]:m-0">
            <TopCommunitiesWidget />
          </div>
        </div>
      </div>
    </div>
  );
}
