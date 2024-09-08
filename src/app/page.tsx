import { Feedback, Navbar, ScrollToTop, Theme } from "@/features/shared";
import { LandingPage } from "@/app/_components";

export const dynamic = "force-dynamic";

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
