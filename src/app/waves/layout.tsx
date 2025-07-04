"use client";

import { Feedback, Navbar, ScrollToTop } from "@/features/shared";
import { PropsWithChildren, ReactNode } from "react";
import { TopCommunitiesWidget } from "@/app/_components/top-communities-widget";
import {
  WaveFollowsCard,
  WavePromoteCard,
  WavesProfileCard,
  ClientOnly
} from "@/app/waves/_components";
import { useWindowSize } from "react-use";
import { getTailwindBreakpoint } from "@/core/tailwind";
import { clsx } from "clsx";
import { useWavesGrid } from "@/app/waves/_hooks";
import "./common.scss";

interface Props {
  view: ReactNode;
}

export default function WavesLayout(props: PropsWithChildren<Props>) {
  const [grid] = useWavesGrid();

  const { width } = useWindowSize();

  return (
    <div className="waves-page-layout bg-blue-duck-egg dark:bg-dark-700 min-h-[100vh]">
      <Feedback />
      <ScrollToTop />
      <Navbar experimental={true} />
      <div className="pt-[156px] max-w-[1600px] px-4 md:px-6 lg:px-8 mx-auto grid md:grid-cols-12 gap-4 md:gap-6 xl:gap-8">
        <div className="col-span-12 md:col-span-4 xl:col-span-3 flex flex-col gap-4 xl:gap-8">
          <WavesProfileCard />
          <WavePromoteCard />
          <ClientOnly>
            {grid === "masonry" ||
              (width < getTailwindBreakpoint("xl") && (
                <>
                  <WaveFollowsCard />
                  <div className="rounded-2xl bg-white dark:bg-dark-200 p-4 [&_.item-content]:!mr-0 [&_.top-communities-widget]:p-0 [&_.top-communities-widget]:m-0">
                    <TopCommunitiesWidget />
                  </div>
                </>
              ))}
          </ClientOnly>
        </div>
        <div
          className={clsx(
            grid === "masonry" && "md:col-span-7 lg:col-span-8 xl:col-span-9",
            grid === "feed" && "md:col-span-7 lg:col-span-8 xl:col-span-6"
          )}
        >
          {props.children}
        </div>
        <div className="hidden xl:col-span-3 xl:flex flex-col gap-4 md:gap-6 xl:gap-8">
          <WaveFollowsCard />
          <div className="rounded-2xl bg-white dark:bg-dark-200 p-4 [&_.item-content]:!mr-0 [&_.top-communities-widget]:p-0 [&_.top-communities-widget]:m-0">
            <TopCommunitiesWidget />
          </div>
        </div>
      </div>
    </div>
  );
}
