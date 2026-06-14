import i18next from "i18next";
import Link from "next/link";
import { initI18next } from "@/features/i18n";
import defaults from "@/defaults.json";
import { LandingHeroActions } from "./landing-hero-actions";
import { LandingSubscribeForm } from "./landing-subscribe-form";
import { LandingSignInLink } from "./landing-sign-in-link";
import { LandingDownloadLinks } from "./landing-download-links";
import { Suspense } from "react";
import { LandingTrending, LandingTrendingSkeleton } from "./landing-trending";
import { LandingExplore } from "./landing-explore";

/**
 * Anonymous landing page — conversion-first, mobile-first.
 *
 * Everything above the fold (logo + hero text + CTAs + stats) is plain
 * server-rendered HTML styled with Tailwind utilities that already ship in the
 * global stylesheet. The page no longer imports a route-specific SCSS bundle,
 * so the hero (the LCP element) is not gated behind a ~91KB render-blocking
 * <link>. Heavy illustrated marketing sections were removed; the value prop is
 * carried by a compact icon row plus the live trending strip + topic hubs,
 * which double as crawl entry points into deep content.
 *
 * Inline SVG feature icons avoid pulling the @ui/svg barrel onto this path.
 */
const FEATURES = [
  {
    key: "own",
    title: "landing-page.true-ownership",
    desc: "landing-page.feature-own-desc",
    icon: (
      <path d="M12 2 4 6v6c0 5 3.4 7.7 8 10 4.6-2.3 8-5 8-10V6l-8-4Zm0 6a2.2 2.2 0 0 1 1 4.2V15a1 1 0 1 1-2 0v-2.8A2.2 2.2 0 0 1 12 8Z" />
    )
  },
  {
    key: "earn",
    title: "landing-page.earn-money",
    desc: "landing-page.feature-earn-desc",
    icon: (
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm.9 15.4v.8a.9.9 0 0 1-1.8 0v-.8a3.4 3.4 0 0 1-2.4-1.6.9.9 0 0 1 1.5-1 1.7 1.7 0 0 0 1.5.8c.9 0 1.5-.4 1.5-1s-.5-.9-1.7-1.2c-1.4-.4-2.9-.9-2.9-2.8a2.9 2.9 0 0 1 2.4-2.7v-.8a.9.9 0 0 1 1.8 0v.8a3.2 3.2 0 0 1 2.1 1.4.9.9 0 1 1-1.5 1 1.5 1.5 0 0 0-1.3-.7c-.8 0-1.4.4-1.4.9 0 .6.5.8 1.7 1.1 1.4.4 2.9 1 2.9 2.9a2.9 2.9 0 0 1-2.4 2.6Z" />
    )
  },
  {
    key: "open",
    title: "landing-page.decentralization",
    desc: "landing-page.feature-open-desc",
    icon: (
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm6.9 9h-3a14.7 14.7 0 0 0-1-4.6A8 8 0 0 1 18.9 11ZM12 4c.9 0 2.2 2.3 2.6 7H9.4C9.8 6.3 11.1 4 12 4ZM4.6 13h3a14.7 14.7 0 0 0 1 4.6A8 8 0 0 1 4.6 13Zm3-2h-3a8 8 0 0 1 4-4.6 14.7 14.7 0 0 0-1 4.6ZM12 20c-.9 0-2.2-2.3-2.6-7h5.2C14.2 17.7 12.9 20 12 20Zm2.4-.4a14.7 14.7 0 0 0 1-4.6h3a8 8 0 0 1-4 4.6Z" />
    )
  }
];

export async function LandingPage() {
  await initI18next();
  const t = i18next.t.bind(i18next);

  return (
    <div className="landing-wrapper relative w-full">
      {/* HERO — fully server-rendered, the LCP element */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-duck-egg to-blue-dark-sky-030 dark:from-dark-default dark:to-dark-200">
        <div className="max-w-[1000px] mx-auto px-4 pt-14 pb-12 md:pt-24 md:pb-16 text-center">
          <img
            src={defaults.logo}
            alt={defaults.name}
            width={64}
            height={64}
            className="mx-auto mb-6 h-14 w-14 md:h-16 md:w-16"
            fetchPriority="high"
          />
          <h1 className="font-extrabold tracking-tight leading-[1.05] text-blue-dark-sky dark:text-gray-pinkish text-[2rem] sm:text-5xl md:text-6xl">
            {t("landing-page.hero-title")}
          </h1>
          <p className="mt-4 mx-auto max-w-xl font-light text-gray-700 dark:text-gray-light text-lg md:text-2xl">
            {t("landing-page.what-is-ecency")}
          </p>

          <LandingHeroActions />

          <ul className="mt-10 flex flex-wrap justify-center items-center gap-x-5 gap-y-2 p-0 m-0 list-none text-sm md:text-base text-gray-700 dark:text-gray-light">
            <li>
              <strong className="text-blue-dark-sky dark:text-gray-pinkish">130M+</strong>{" "}
              {t("landing-page.posts")}
            </li>
            <li aria-hidden="true" className="opacity-40">
              ·
            </li>
            <li>
              <strong className="text-blue-dark-sky dark:text-gray-pinkish">200K+</strong>{" "}
              {t("landing-page.new-users")}
            </li>
            <li aria-hidden="true" className="opacity-40">
              ·
            </li>
            <li>
              <strong className="text-blue-dark-sky dark:text-gray-pinkish">446M</strong>{" "}
              {t("landing-page.points-distrubuted")}
            </li>
            <li aria-hidden="true" className="opacity-40">
              ·
            </li>
            <li>
              <strong className="text-blue-dark-sky dark:text-gray-pinkish">14M+</strong>{" "}
              {t("landing-page.unique-visitors")}
            </li>
          </ul>
        </div>
      </section>

      {/* Real product first: live trending posts (SEO + click-through). Streams
          via Suspense so the hero flushes immediately. */}
      <Suspense fallback={<LandingTrendingSkeleton />}>
        <LandingTrending />
      </Suspense>

      {/* Topic hubs — crawl entry points into deep content */}
      <LandingExplore />

      {/* Why Ecency — compact value prop replacing the old illustrated sections */}
      <section className="relative z-[2] w-full" aria-labelledby="why-heading">
        <div className="inner max-w-[1200px] mx-auto w-full px-4 py-10">
          <h2 id="why-heading" className="text-2xl md:text-3xl font-bold mb-6">
            {t("landing-page.why-ecency")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div
                key={f.key}
                className="rounded-xl border border-[--border-color] bg-white dark:bg-dark-200 p-5"
              >
                <span className="inline-flex items-center justify-center h-11 w-11 rounded-lg bg-blue-dark-sky-040 dark:bg-dark-default text-blue-dark-sky">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    {f.icon}
                  </svg>
                </span>
                <h3 className="mt-4 text-lg font-semibold">{t(f.title)}</h3>
                <p className="mt-1 opacity-70">{t(f.desc)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Download */}
      <section className="relative z-[2] w-full" id="download">
        <div className="inner max-w-[1200px] mx-auto w-full px-4 py-10">
          <div className="rounded-2xl border border-[--border-color] bg-blue-duck-egg dark:bg-dark-200 px-5 py-8 text-center">
            <h2 className="text-2xl md:text-3xl font-bold">
              {t("landing-page.download-our-application")}
            </h2>
            <p className="mt-2 opacity-70">{t("landing-page.download-our-application-desc-1")}</p>
            <div className="mt-5 flex flex-wrap justify-center gap-3 [&_a]:inline-flex [&_a]:items-center [&_a]:gap-2 [&_a]:h-12 [&_a]:px-5 [&_a]:rounded-full [&_a]:border [&_a]:border-[--border-color] [&_a]:bg-white [&_a]:dark:bg-dark-default [&_a]:font-medium [&_a]:transition-shadow hover:[&_a]:shadow-md [&_img]:h-5 [&_img]:w-5 [&_svg]:h-5 [&_svg]:w-5">
              <LandingDownloadLinks
                iosIcon={`${defaults.base}/assets/icon-apple.svg`}
                iosIconWhite={`${defaults.base}/assets/icon-apple-white.svg`}
                androidIcon={`${defaults.base}/assets/icon-android.png`}
                androidIconWhite={`${defaults.base}/assets/icon-android-white.svg`}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-[2] w-full border-t border-[--border-color] mt-4">
        <div className="inner max-w-[1200px] mx-auto w-full px-4 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <nav className="flex flex-col gap-2" aria-label={t("landing-page.about")}>
              <Link href="#about" className="opacity-70 hover:opacity-100">
                {t("landing-page.about")}
              </Link>
              <Link href="/faq" className="opacity-70 hover:opacity-100">
                {t("landing-page.faq")}
              </Link>
              <Link href="/terms-of-service" className="opacity-70 hover:opacity-100">
                {t("landing-page.terms-of-service")}
              </Link>
              <Link href="/privacy-policy" className="opacity-70 hover:opacity-100">
                {t("landing-page.privacy-policy")}
              </Link>
            </nav>
            <nav className="flex flex-col gap-2" aria-label={t("landing-page.discover")}>
              <Link href="/discover" className="opacity-70 hover:opacity-100">
                {t("landing-page.discover")}
              </Link>
              <span className="opacity-70 hover:opacity-100">
                <LandingSignInLink />
              </span>
              <Link href="/communities" className="opacity-70 hover:opacity-100">
                {t("landing-page.communities")}
              </Link>
              <Link href="/faq" className="opacity-70 hover:opacity-100">
                {t("landing-page.help")}
              </Link>
              <Link href="/mobile" className="opacity-70 hover:opacity-100">
                {t("landing-page.get-mobile-app")}
              </Link>
            </nav>

            <div className="col-span-2">
              <h2 className="text-lg font-semibold">{t("landing-page.subscribe-us")}</h2>
              <div className="mt-3 [&_form]:flex [&_form]:gap-2 [&_input]:flex-1 [&_input]:h-11 [&_input]:px-3 [&_input]:rounded-lg [&_input]:border [&_input]:border-[--border-color] [&_input]:bg-white [&_input]:dark:bg-dark-200 [&_button]:h-11 [&_button]:px-5 [&_button]:rounded-lg [&_button]:bg-blue-dark-sky [&_button]:text-white [&_button]:font-medium">
                <LandingSubscribeForm />
              </div>
              <p className="mt-2 text-sm opacity-60">{t("landing-page.subscribe-paragraph")}</p>
              <ul className="mt-4 flex gap-4 p-0 m-0 list-none [&_img]:h-6 [&_img]:w-6 [&_a]:opacity-70 hover:[&_a]:opacity-100">
                <li>
                  <Link href="https://youtube.com/ecency" target="_blank" rel="noopener noreferrer">
                    <img src={`${defaults.base}/assets/footer-youtube.svg`} alt="YouTube" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="https://twitter.com/ecency_official"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img src={`${defaults.base}/assets/footer-twitter.svg`} alt="X" />
                  </Link>
                </li>
                <li>
                  <Link href="https://t.me/ecency" target="_blank" rel="noopener noreferrer">
                    <img src={`${defaults.base}/assets/footer-telegram.svg`} alt="Telegram" />
                  </Link>
                </li>
                <li>
                  <Link href="https://discord.me/ecency" target="_blank" rel="noopener noreferrer">
                    <img src={`${defaults.base}/assets/footer-discord.svg`} alt="Discord" />
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-3 border-t border-[--border-color] pt-6">
            <img src={defaults.logo} alt={defaults.name} width={36} height={36} className="h-9 w-9" />
            <p className="m-0 text-sm opacity-60">{t("landing-page.copy-rights")}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
