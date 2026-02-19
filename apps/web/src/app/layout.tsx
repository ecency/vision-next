import "@/styles/style.scss";
import "@/core/sdk-init"; // Initialize SDK DMCA filters immediately (SSR)
import Providers from "@/app/providers";
import { HiringConsoleLog } from "@/app/_components";
import { cookies } from "next/headers";
import { Theme } from "@/enums";
import { BannerManager } from "@/features/banners";
import React from "react";
import Script from "next/script";
import localFont from "next/font/local";
import { Metadata } from "next";
import defaults from "@/defaults.json";

export const metadata: Metadata = {
  metadataBase: new URL(defaults.base),
  openGraph: {
    siteName: defaults.name,
    images: [
      {
        url: "/og.jpg",
        width: 1200,
        height: 630,
        alt: defaults.name,
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    site: defaults.twitterHandle,
    creator: defaults.twitterHandle,
    images: ["/og.jpg"],
  },
};

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
  display: "swap",
  preload: true // Enable preloading for critical fonts
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
        {/*
          Global CONFIG stub for Twitter/X in-app browser compatibility.
          Loaded from external file to comply with CSP policies.
          See /public/scripts/config-stub.js for details.
        */}
        <script src="/scripts/config-stub.js" />
        {/* Preload critical fonts for LCP optimization */}
        <link
          rel="preload"
          href="/fonts/inter/Inter-Regular.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/inter/Inter-Bold.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
        {/* Preload hero image for LCP optimization (WebP format - 12KB vs 29KB PNG) */}
        <link
          rel="preload"
          href="https://images.ecency.com/assets/illustration-earn-money.webp"
          as="image"
          type="image/webp"
          imageSizes="(max-width: 640px) 280px, (max-width: 768px) 320px, (max-width: 1024px) 360px, 373px"
        />
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
