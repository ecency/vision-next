"use client";

import Link from "next/link";
import i18next from "i18next";
import { useGlobalStore } from "@/core/global-store";

interface Props {
  iosIcon: string;
  iosIconWhite: string;
  androidIcon: string;
  androidIconWhite: string;
}

export function LandingDownloadLinks({
  iosIcon,
  iosIconWhite,
  androidIcon,
  androidIconWhite
}: Props) {
  const theme = useGlobalStore((s) => s.theme);

  return (
    <>
      <Link href="https://ios.ecency.com/" target="_blank" rel="noopener noreferrer">
        <img
          src={theme === "day" ? iosIcon : iosIconWhite}
          alt={i18next.t("landing-page.download-for-ios")}
        />
        {i18next.t("landing-page.download-for-ios")}
      </Link>
      <Link href="https://android.ecency.com/" target="_blank" rel="noopener noreferrer">
        <img
          src={theme === "day" ? androidIcon : androidIconWhite}
          alt={i18next.t("landing-page.download-for-android")}
        />
        {i18next.t("landing-page.download-for-android")}
      </Link>
    </>
  );
}
