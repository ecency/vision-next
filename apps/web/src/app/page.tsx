import { Feedback } from "@/features/shared/feedback";
import { ScrollToTop } from "@/features/shared/scroll-to-top";
import { Theme } from "@/features/shared/theme";
import { Navbar } from "@/features/shared/navbar";
import { LandingPage } from "@/app/_components/landing-page";
import { Metadata } from "next";
import defaults from "@/defaults.json";
import { getServerAppBase } from "@/utils/server-app-base";
import { JsonLd, buildWebsiteJsonLd } from "@/features/structured-data";

// ISR: the marketing shell is static, but the trending strip pulls live ranked
// posts. Revalidate on the same cadence as the "home" edge-cache tier (s-maxage
// 300) so the homepage stays fast (served static) without freezing trending at
// build time.
export const revalidate = 300;

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
  const base = await getServerAppBase();
  return (
    <>
      {/*<Meta {...metaProps} />*/}
      <JsonLd data={buildWebsiteJsonLd(base)} />
      <ScrollToTop />
      <Theme />
      <Feedback />
      <Navbar />
      <LandingPage />
    </>
  );
}
