import "@/styles/style.scss";
import Providers from "@/app/providers";
import { HiringConsoleLog } from "@/app/_components";
import { cookies } from "next/headers";
import { Theme } from "@/enums";
import { BannerManager } from "@/features/banners";
import React from "react";
import Script from "next/script";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const theme = (await cookies()).get("theme")?.value;

  return (
    <html lang="en">
      <Script defer data-domain="ecency.com" data-api="/pl/api/event" src="/pl/js/script.js" />
      <body className={theme === Theme.night ? "dark" : ""}>
        <BannerManager />
        <HiringConsoleLog />
        <Providers>{children}</Providers>
        <div id="modal-overlay-container" />
        <div id="modal-dialog-container" />
        <div id="popper-container" />
      </body>
    </html>
  );
}
