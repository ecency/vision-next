"use client";

import { Feedback, Navbar, ScrollToTop } from "@/features/shared";
import { PropsWithChildren, ReactNode } from "react";
import {
  WaveFollowsCard,
  WavePromoteCard,
  WavesProfileCard,
  ClientOnly,
  WavesTrendingTagsCard
} from "@/app/waves/_components";
import { useWindowSize } from "react-use";
import { getTailwindBreakpoint } from "@/core/tailwind";
import { clsx } from "clsx";
import { useWavesGrid } from "@/app/waves/_hooks";
import "./common.scss";
import { WavesHostProvider, WavesTagFilterProvider } from "@/app/waves/_context";

interface Props {
  view: ReactNode;
}

export default function WavesLayout(props: PropsWithChildren<Props>) {
  const [grid] = useWavesGrid();

  const { width } = useWindowSize();

  return (
    <WavesHostProvider>
      <WavesTagFilterProvider>
        <div className="waves-page-layout bg-blue-duck-egg dark:bg-dark-700 min-h-[100vh]">
          <Feedback />
          <ScrollToTop />
          <Navbar experimental={true} />
          <div className="pt-4 md:pt-[108px] max-w-[1600px] md:px-6 lg:px-8 mx-auto grid grid-cols-12 gap-4 md:gap-6 xl:gap-8">
            <div className="hidden md:col-span-4 xl:col-span-3 md:flex flex-col gap-4 xl:gap-8">
              <WavesProfileCard />
              <WavePromoteCard />
              <ClientOnly>
                {grid === "masonry" ||
                  (width < getTailwindBreakpoint("xl") && (
                    <>
                      <WavesTrendingTagsCard />
                      <WaveFollowsCard />
                    </>
                  ))}
              </ClientOnly>
            </div>
            <div
              className={clsx(
                grid === "masonry" && "col-span-12 md:col-span-7 lg:col-span-8 xl:col-span-9",
                grid === "feed" && "col-span-12 md:col-span-7 lg:col-span-8 xl:col-span-6"
              )}
            >
              {props.children}
            </div>
            <div className="hidden xl:col-span-3 xl:flex flex-col gap-4 md:gap-6 xl:gap-8">
              <WavesTrendingTagsCard />
              <WaveFollowsCard />
            </div>
          </div>
        </div>
      </WavesTagFilterProvider>
    </WavesHostProvider>
  );
}
