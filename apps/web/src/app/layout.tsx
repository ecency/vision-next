import "@/styles/style.scss";
import Providers from "@/app/providers";
import { HiringConsoleLog } from "@/app/_components";
import { cookies } from "next/headers";
import { Theme } from "@/enums";
import { BannerManager } from "@/features/banners";
import React from "react";
import Script from "next/script";
import localFont from "next/font/local";

const inter = localFont({
  src: [
    { path: "../../public/fonts/inter/Inter-Regular.ttf", weight: "400", style: "normal" },
    { path: "../../public/fonts/inter/Inter-Italic.ttf", weight: "400", style: "italic" },

    { path: "../../public/fonts/inter/Inter-Light.ttf", weight: "300", style: "normal" },
    { path: "../../public/fonts/inter/Inter-LightItalic.ttf", weight: "300", style: "italic" },

    { path: "../../public/fonts/inter/Inter-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "../../public/fonts/inter/Inter-SemiBoldItalic.ttf", weight: "600", style: "italic" },

    { path: "../../public/fonts/inter/Inter-Bold.ttf", weight: "700", style: "normal" },
    { path: "../../public/fonts/inter/Inter-BoldItalic.ttf", weight: "700", style: "italic" },

    { path: "../../public/fonts/inter/Inter-Medium.ttf", weight: "500", style: "normal" },
    { path: "../../public/fonts/inter/Inter-MediumItalic.ttf", weight: "500", style: "italic" }
  ],
  variable: "--font-inter",
  display: "swap"
});

const lora = localFont({
  src: [
    { path: "../../public/fonts/lora/Lora-Regular.ttf", weight: "400", style: "normal" },
    { path: "../../public/fonts/lora/Lora-Bold.ttf", weight: "700", style: "normal" }
  ],
  variable: "--font-lora",
  display: "swap"
});

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const theme = (await cookies()).get("theme")?.value;

  return (
    <html lang="en" className={`${lora.variable} ${inter.variable}`}>
      <head>
        <link rel="dns-prefetch" href="https://images.ecency.com" />
        <link rel="dns-prefetch" href="https://ecency.com" />
        <link rel="preconnect" href="https://images.ecency.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://ecency.com" crossOrigin="anonymous" />
      </head>
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
