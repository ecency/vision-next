import { Navbar, ScrollToTop, Theme } from "@/features/shared";
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
  }>
) {
  return (
    <>
      <ScrollToTop />
      <FullHeight />
      <Theme />
      <Navbar />
      <div className="bg-blue-duck-egg dark:bg-transparent pt-[63px] md:pt-[69px] min-h-[100vh] pb-16">
        <div className="absolute hidden lg:block top-16 left-0 right-0 bottom-0">
          <Image
            width={1920}
            height={1920}
            src="/assets/signup.png"
            alt=""
            className="absolute top-0 right-0 bottom-0 max-w-[55vw] w-full"
          />
          <div className="bg-gradient-to-t from-blue-duck-egg dark:from-black to-transparent w-full h-full min-h-[500px] relative" />
        </div>

        <div className="container mx-auto px-4">
          <div className="md:min-h-[400px] rounded-b-3xl items-end justify-start grid grid-cols-12">
            <div className="col-span-12 lg:col-span-6 relative">
              <h1 className="text-xl md:text-5xl relative md:leading-[4rem]">
                <b className="text-blue-dark-sky">{i18next.t("discover.title")}</b> –{" "}
                {i18next.t("discover.title-next")}
              </h1>
            </div>
          </div>
          {props.communities}
          {props.leaderboard}
          {props.curation}
          {props.contributors}
          <div className="relative">{props.children}</div>
        </div>
      </div>
    </>
  );
}
