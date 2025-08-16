import "@/styles/style.scss";
import Providers from "@/app/providers";
import { HiringConsoleLog } from "@/app/_components";
import { cookies } from "next/headers";
import { Theme } from "@/enums";
import { BannerManager } from "@/features/banners";
import React from "react";
import Script from "next/script";
import localFont from "next/font/local";

const notoSans = localFont({
  src: [
    { path: "../../public/fonts/noto-sans/NotoSans-Regular.ttf", weight: "400", style: "normal" },
    { path: "../../public/fonts/noto-sans/NotoSans-Bold.ttf", weight: "700", style: "normal" }
  ],
  variable: "--font-noto-sans",
  display: "swap",
});

const notoSerif = localFont({
  src: [
    { path: "../../public/fonts/noto-serif/NotoSerif-Regular.ttf", weight: "400", style: "normal" },
    { path: "../../public/fonts/noto-serif/NotoSerif-Bold.ttf", weight: "700", style: "normal" }
  ],
  variable: "--font-noto-serif",
  display: "swap",
});

const lora = localFont({
  src: [
    { path: "../../public/fonts/lora/Lora-Regular.ttf", weight: "400", style: "normal" },
    { path: "../../public/fonts/lora/Lora-Bold.ttf", weight: "700", style: "normal" }
  ],
  variable: "--font-lora",
  display: "swap",
});

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const theme = (await cookies()).get("theme")?.value;

  return (
    <html lang="en" className={`${notoSans.variable} ${notoSerif.variable} ${lora.variable}`}>
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

