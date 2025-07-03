"use client";

import { Navbar, ScrollToTop, Theme } from "@/features/shared";
import { UilArrowLeft, UilArrowRight } from "@tooni/iconscout-unicons-react";
import { Button } from "@ui/button";
import i18next from "i18next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PropsWithChildren } from "react";

export default function Layout(props: PropsWithChildren) {
  const pathname = usePathname();

  return (
    <>
      <ScrollToTop />
      <Theme />
      <Navbar experimental={true} />
      <div className="bg-blue-duck-egg dark:bg-black pt-[63px] md:pt-[69px] min-h-[100vh] pb-16">
        <div className="container mx-auto px-2 sm:p-0 relative mt-4 md:mt-0">
          <div className="grid grid-cols-12 my-4 md:mb-10 items-center gap-4 md:gap-6 lg:gap-8 xl:gap-10 p-2 sm:p-0 md:mt-16">
            <div className="col-span-12 md:col-span-6">
              <h1 className="text-blue-dark-sky text-xl md:text-3xl font-bold md:leading-[3rem]">
                {i18next.t("communities.title")}
              </h1>
              <h2 className="text-lg md:text-2xl mb-2 md:mb-4">
                {i18next.t("communities.description")}
              </h2>

              {pathname !== "/communities/create" && (
                <Link href="/communities/create">
                  <Button size="lg" icon={<UilArrowRight />}>
                    {i18next.t("communities.create")}
                  </Button>
                </Link>
              )}
            </div>
            <div className="col-span-12 md:col-span-6">
              <p className="text-sm md:text-right md:ml-auto md:max-w-[320px]">
                {i18next.t("communities.hint")}
              </p>
            </div>
          </div>

          {props.children}
        </div>
      </div>
    </>
  );
}
