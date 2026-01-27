"use client";

import { Feedback, Navbar } from "@/features/shared";
import i18next from "i18next";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { PropsWithChildren, useEffect, useState } from "react";

export function SignupLayoutClient({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const hideHeader = pathname?.startsWith("/signup/email");
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
                className="w-full max-h-[400px] object-fit"
              />
            </div>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
