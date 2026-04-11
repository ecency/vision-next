import "@/styles/style.scss";
import "@/core/sdk-init"; // Initialize SDK DMCA filters immediately (SSR)
import Providers from "@/app/providers";
import { HiringConsoleLog } from "@/app/_components";
import { cookies } from "next/headers";
import { Theme } from "@/enums";
import { BannerManager } from "@/features/banners";
import React from "react";
import Script from "next/script";
import { Inter, Lora } from "next/font/google";
import { Metadata, Viewport } from "next";
import defaults from "@/defaults.json";

export const metadata: Metadata = {
  metadataBase: new URL(defaults.base),
  applicationName: defaults.name,
  appleWebApp: {
    capable: true,
    title: defaults.name,
    statusBarStyle: "default"
  },
  icons: {
    icon: [
      { url: "/assets/logo-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/assets/logo-384x384.png", sizes: "384x384", type: "image/png" },
      { url: "/assets/logo-512x512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [{ url: "/assets/logo-192x192.png", sizes: "192x192", type: "image/png" }]
  },
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

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#131111" }
  ]
};

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap"
});

const lora = Lora({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "700"],
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
        <script src="/scripts/chunk-reload.js" />
        <script async src="/scripts/config-stub.js" />
        <link rel="dns-prefetch" href="https://images.ecency.com" />
        <link rel="dns-prefetch" href="https://ecency.com" />
        <link rel="preconnect" href="https://images.ecency.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://ecency.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://o4507985141956608.ingest.de.sentry.io" crossOrigin="anonymous" />
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
