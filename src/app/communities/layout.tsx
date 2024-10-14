import React, { PropsWithChildren } from "react";
import { Navbar, ScrollToTop, Theme } from "@/features/shared";
import Image from "next/image";
import i18next from "i18next";
import Link from "next/link";
import { Button } from "@ui/button";

export default function Layout(props: PropsWithChildren) {
  return (
    <>
      <ScrollToTop />
      <Theme />
      <Navbar />
      <div className="bg-blue-duck-egg dark:bg-black pt-[63px] md:pt-[69px] min-h-[100vh] pb-16">
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
        <div className="container mx-auto px-4 relative">
          <div className="md:min-h-[400px] rounded-b-3xl items-end justify-start grid grid-cols-12 mb-4 md:mb-8 xl:mb-16">
            <div className="col-span-12 lg:col-span-6 relative">
              <h1 className="text-xl md:text-5xl relative md:leading-[4rem] mb-2 md:mb-4 xl:mb-8">
                <b className="text-blue-dark-sky">{i18next.t("communities.title")}</b> –{" "}
                {i18next.t("communities.description")}
              </h1>
              <Link href="/communities/create">
                <Button>{i18next.t("communities.create")}</Button>
              </Link>
            </div>
          </div>
          {props.children}
        </div>
      </div>
    </>
  );
}
