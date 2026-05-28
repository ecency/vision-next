import { Feedback } from "@/features/shared/feedback";
import { ScrollToTop } from "@/features/shared/scroll-to-top";
import { Theme } from "@/features/shared/theme";
import { Navbar } from "@/features/shared/navbar";
import { LandingPage } from "@/app/_components/landing-page";
import { Metadata } from "next";
import defaults from "@/defaults.json";
import { JsonLd, buildWebsiteJsonLd } from "@/features/structured-data";

// Canonical site base. The homepage represents the ecency.com WebSite entity
// regardless of which host served it, so use a stable base (env override for
// non-prod) rather than getServerAppBase(), which reads headers().
//
// NOTE on freshness: this route is dynamic (the root layout reads the theme
// cookie), so it is not statically prerendered. The trending strip's ranked-
// posts RPC is throttled by the edge "home" cache tier (s-maxage=300, set in
// next-middleware/cache-policy) and streamed via <Suspense>, so the hero (LCP)
// flushes without waiting on it.
const APP_BASE = process.env.NEXT_PUBLIC_APP_BASE || process.env.APP_BASE || defaults.base;

export async function generateMetadata(): Promise<Metadata> {
  const base = APP_BASE;

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
      <JsonLd data={buildWebsiteJsonLd(APP_BASE)} />
      <ScrollToTop />
      <Theme />
      <Feedback />
      <Navbar />
      <LandingPage />
    </>
  );
}
