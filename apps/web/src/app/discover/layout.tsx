import { Navbar } from "@/features/shared/navbar";
import { ScrollToTop } from "@/features/shared/scroll-to-top";
import { Theme } from "@/features/shared/theme";
import { FullHeight } from "@/features/ui";
import React, { PropsWithChildren, ReactNode } from "react";
import Image from "next/image";
import i18next from "i18next";

export default function Layout(
  props: PropsWithChildren<{
    communities: ReactNode;
    leaderboard: ReactNode;
    curation: ReactNode;
    contributors: ReactNode;
    communitiesDialog: ReactNode;
  }>
) {
  return (
    <>
      <ScrollToTop />
      <FullHeight />
      <Theme />
      <Navbar experimental={true} />
      <div className="bg-blue-duck-egg dark:bg-black pt-[63px] md:pt-[69px] min-h-[100vh] pb-16">
        <div className="absolute hidden lg:block top-16 left-0 right-0 h-[280px]">
          <Image
            width={1920}
            height={1920}
            src="/assets/discover.svg"
            alt=""
            className="absolute top-0 right-0 max-w-[50vw] h-full object-contain object-right-top"
          />
          <div className="bg-gradient-to-t from-blue-duck-egg dark:from-black to-transparent w-full h-full relative" />
        </div>

        <div className="container mx-auto px-4 mt-4 lg:mt-0">
          <div className="lg:min-h-[200px] rounded-b-3xl items-end justify-start grid grid-cols-12">
            <div className="col-span-12 lg:col-span-6 relative">
              <h1 className="text-xl md:text-3xl relative md:leading-[2.75rem]">
                <b className="text-blue-dark-sky">{i18next.t("discover.title")}</b> –{" "}
                {i18next.t("discover.title-next")}
              </h1>
            </div>
          </div>
          <div className="relative grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mt-6 ms:mt-8 lg:mt-10 xl:mt-16">
            <h3 className="col-span-1 md:col-span-2 text-2xl font-semibold">
              {i18next.t("discover.leads-curators")}
            </h3>
            {props.leaderboard}
            {props.curation}
          </div>
          {props.communities}
          <div className="relative flex flex-col gap-4 sm:gap-6 lg:gap-8 mt-6 ms:mt-8 lg:mt-10 xl:mt-16">
            <h3 className="col-span-1 sm:col-span-2 text-2xl font-semibold">
              {i18next.t("contributors.title")}
            </h3>
            {props.contributors}
          </div>
          <div className="relative">{props.children}</div>
          {props.communitiesDialog}
        </div>
      </div>
    </>
  );
}
