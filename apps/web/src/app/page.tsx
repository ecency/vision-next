import { Feedback, Navbar, ScrollToTop, Theme } from "@/features/shared";
import { LandingPage } from "@/app/_components";
import { Metadata } from "next";
import defaults from "@/defaults.json";
import { getServerAppBase } from "@/utils/server-app-base";

export async function generateMetadata(): Promise<Metadata> {
  const base = await getServerAppBase();

  return {
    title: defaults.title,
    description: defaults.description,
    openGraph: {
      title: defaults.title,
      description: defaults.description,
      url: base,
      siteName: defaults.name,
      images: [
        {
          url: `${base}/og.jpg`,
          width: 1200,
          height: 630,
          alt: defaults.name,
        },
      ],
      locale: "en_US",
      type: "website"
    },
    twitter: {
      card: "summary_large_image",
      title: defaults.title,
      description: defaults.description,
      site: defaults.twitterHandle,
      creator: defaults.twitterHandle,
      images: [`${base}/og.jpg`]
    },
    alternates: {
      canonical: base
    }
  };
}

export default async function Home() {
  return (
    <>
      {/*<Meta {...metaProps} />*/}
      <ScrollToTop />
      <Theme />
      <Feedback />
      <Navbar />
      <LandingPage />
    </>
  );
}
