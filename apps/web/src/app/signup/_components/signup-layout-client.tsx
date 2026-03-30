"use client";

import { Feedback } from "@/features/shared/feedback";
import { Navbar } from "@/features/shared/navbar";
import i18next from "i18next";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UilArrowLeft } from "@tooni/iconscout-unicons-react";
import { PropsWithChildren, useEffect, useState } from "react";

export function SignupLayoutClient({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const hideHeader = pathname?.startsWith("/signup/free") || pathname?.startsWith("/signup/premium") || pathname?.startsWith("/signup/email") || pathname?.startsWith("/signup/invited");
  const isSubPage = pathname !== "/signup" && pathname?.startsWith("/signup/");
  const [, setTick] = useState(0);

  // Subscribe to language changes to trigger re-render
  useEffect(() => {
    const handleLanguageChanged = () => {
      setTick(prev => prev + 1);
    };

    i18next.on("languageChanged", handleLanguageChanged);

    return () => {
      i18next.off("languageChanged", handleLanguageChanged);
    };
  }, []);

  return (
    <div className=" bg-blue-duck-egg dark:bg-transparent pt-[63px] md:pt-[69px] min-h-[100vh] pb-16">
      <Feedback />
      <Navbar experimental={true} />

      <div className="container mb-24 md:mb-0 px-2 mx-auto mt-6 md:mt-8">
        {!hideHeader && (
          <div className="grid grid-cols-12 mb-10 items-center gap-4 md:gap-6 lg:gap-8 xl:gap-10">
            <div className="col-span-12 md:col-span-6">
              <h1 className="text-blue-dark-sky text-xl md:text-3xl font-bold md:leading-[3rem]">
                {i18next.t("sign-up.header")}
              </h1>
              <h2 className="text-lg md:text-2xl">{i18next.t("sign-up.description")}</h2>
              <p className="mt-4">{i18next.t("sign-up.description-2")}</p>
            </div>

            <div className="col-span-12 md:col-span-6 top-16 rounded-2xl hidden md:block overflow-hidden">
              <Image
                width={1920}
                height={1920}
                src="/assets/signup-main.svg"
                alt=""
                className="w-full max-h-[240px] object-contain"
              />
            </div>
          </div>
        )}
        {isSubPage && (
          <Link href="/signup" className="inline-flex items-center gap-1 text-sm text-blue-dark-sky hover:underline mb-4">
            <UilArrowLeft className="w-4 h-4" />
            {i18next.t("sign-up.all-options", { defaultValue: "All signup options" })}
          </Link>
        )}
        {children}
      </div>
    </div>
  );
}
