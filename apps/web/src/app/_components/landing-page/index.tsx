import "./_index.scss";
import "@/styles/static-pages.scss";
import i18next from "i18next";
import Link from "next/link";
import Image from "next/image";
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
 * Helper to build a <picture> element that serves webp with png/jpeg fallback.
 * This replaces the old client-side canUseWebp check with pure HTML content negotiation.
 */
interface AssetPictureProps {
  basePath: string;
  fallbackExt?: "png" | "jpeg";
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
}

function AssetPicture({
  basePath,
  fallbackExt = "png",
  alt,
  className,
  loading,
  width,
  height,
  sizes,
  priority
}: AssetPictureProps) {
  const baseUrl = defaults.base;
  const webpSrc = `${baseUrl}/assets/${basePath}.webp`;
  const fallbackSrc = `${baseUrl}/assets/${basePath}.${fallbackExt}`;

  // Static assets are served with images.unoptimized=true, so next/image does
  // no optimization here — it only adds a client component plus a
  // hydration-gated preload that targets the .png fallback instead of the
  // .webp the <picture> actually renders. A plain server-rendered <img> is in
  // the initial HTML, lets the preload scanner discover the webp source
  // without waiting for JS, and trims hydration work on the landing page.
  if (priority) {
    return (
      <picture>
        <source srcSet={webpSrc} type="image/webp" />
        <img
          src={fallbackSrc}
          alt={alt}
          width={width}
          height={height}
          className={className}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          sizes={sizes}
        />
      </picture>
    );
  }

  return (
    <picture>
      <source srcSet={webpSrc} type="image/webp" />
      <img
        src={fallbackSrc}
        alt={alt}
        className={className}
        loading={loading ?? "lazy"}
        width={width}
        height={height}
        sizes={sizes}
      />
    </picture>
  );
}

function SvgAsset({ path, alt, className }: { path: string; alt: string; className?: string }) {
  return <img src={`${defaults.base}/assets/${path}`} alt={alt} className={className} loading="lazy" />;
}

export async function LandingPage() {
  await initI18next();
  const t = i18next.t.bind(i18next);
  const baseUrl = defaults.base;

  return (
    <div className="landing-wrapper" id="landing-wrapper">
      <div className="top-bg" />

      {/* Hero Section */}
      <div className="sections first-section">
        <div className="text-container text-center">
          <h1>{t("landing-page.welcome-text")}</h1>
          <div className="flex flex-wrap justify-center items-center">
            <p className="mb-3 w-88">{t("landing-page.what-is-ecency")}</p>
          </div>
          <LandingHeroActions />
        </div>
      </div>

      {/* Real content first: trending posts + topic hubs for click-through + crawl discovery.
          Trending streams via Suspense so the hero (LCP) flushes immediately and the
          blocking ranked-posts RPC never delays first paint. */}
      <Suspense fallback={<LandingTrendingSkeleton />}>
        <LandingTrending />
      </Suspense>
      <LandingExplore />

      {/* Earn Money & True Ownership */}
      <div className="sections second-section" id="earn-money">
        <div className="part-top">
          <div className="inner">
            <AssetPicture
              basePath="illustration-earn-money"
              alt={t("landing-page.earn-money")}
              width={373}
              height={442}
              sizes="(max-width: 640px) 280px, (max-width: 768px) 320px, (max-width: 1024px) 360px, 373px"
              className="mx-auto sm:m-0"
            />
            <div className="text-group visible">
              <h2>{t("landing-page.earn-money")}</h2>
              <p className="mt-2 w-88 mb-5 sm:mb-0">
                {t("landing-page.earn-money-block-chain-based")}
                <span>
                  <Link href="/signup?referral=ecency">{t("landing-page.join-us")}</Link>
                </span>
                {t("landing-page.various-digital-tokens")}
              </p>
              <Link className="link-read-more" href="/faq">
                {t("landing-page.read-more")}
              </Link>
            </div>
          </div>
        </div>

        <div className="part-bottom">
          <div className="inner">
            <div className="text-group">
              <h2>{t("landing-page.true-ownership")}</h2>
              <p className="mt-2 w-88">{t("landing-page.true-ownership-desc")}</p>
            </div>
            <div className="image-wrapper">
              <AssetPicture
                basePath="illustration-true-ownership"
                alt={t("landing-page.true-ownership")}
                className="landing-floating-image"
                width={577}
                height={446}
                sizes="(max-width: 768px) 342px, (max-width: 1024px) 499px, 577px"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Decentralization & Open Source */}
      <div className="sections third-section">
        <div className="part-top sm:pt-5 lg:pt-0">
          <div className="inner">
            <div className="img-wrapper">
              <AssetPicture
                basePath="illustration-decentralization"
                alt={t("landing-page.decentralization")}
                className="decentralization-img"
                width={481}
                height={382}
                sizes="(max-width: 768px) 80vw, (max-width: 1280px) 40vw, 33vw"
              />
            </div>
            <div className="text-group visible mw-full">
              <h2>{t("landing-page.decentralization")}</h2>
              <p>
                <span>
                  <Link href="https://hive.io" target="_blank" rel="noopener noreferrer">
                    {t("landing-page.hive-blockchain")}
                  </Link>
                </span>{" "}
                {t("landing-page.decentralization-desc")}
              </p>
            </div>
          </div>
        </div>
        <div className="part-bottom">
          <div className="inner">
            <div className="text-group">
              <h2>{t("landing-page.open-source")}</h2>
              <p>{t("landing-page.open-source-desc")}</p>
              <Link href="/signup?referral=ecency" className="no-break">
                {t("landing-page.feel-free-join")}
              </Link>
            </div>
            <div className="img-wrapper">
              <AssetPicture
                basePath="illustration-open-source"
                alt={t("landing-page.open-source")}
                className="mechanic"
                width={571}
                height={460}
                sizes="(max-width: 768px) 90vw, (max-width: 1024px) 327px, 571px"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats & Download */}
      <div className="sections fourth-section">
        <div className="part-top">
          <div className="inner">
            <ul>
              <li>
                <h3>130M+</h3>
                <p>{t("landing-page.posts")}</p>
              </li>
              <li>
                <h3>14M+</h3>
                <p>{t("landing-page.unique-visitors")}</p>
              </li>
            </ul>
            <ul>
              <li>
                <h3>446M</h3>
                <p>{t("landing-page.points-distrubuted")}</p>
              </li>
              <li>
                <h3>200K+</h3>
                <p>{t("landing-page.new-users")}</p>
              </li>
            </ul>
          </div>
        </div>
        <div className="part-bottom" id="download">
          <div className="inner">
            <div className="text-group">
              <h2>{t("landing-page.download-our-application")}</h2>
              <p className="mt-4">{t("landing-page.download-our-application-desc-1")}</p>
              <p>{t("landing-page.download-our-application-desc-2")}</p>
              <LandingDownloadLinks
                iosIcon={`${baseUrl}/assets/icon-apple.svg`}
                iosIconWhite={`${baseUrl}/assets/icon-apple-white.svg`}
                androidIcon={`${baseUrl}/assets/icon-android.png`}
                androidIconWhite={`${baseUrl}/assets/icon-android-white.svg`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* History & Vision
          dangerouslySetInnerHTML is safe here: translation values come from
          static JSON locale files shipped with the build (en-US.json etc.),
          never from user input. If translations ever include user-generated
          content, sanitize with DOMPurify before inserting. */}
      <div className="sections fifth-section" id="about">
        <div className="part-top pt-5 sm:pt-0">
          <div className="inner">
            <div className="text-group sm:mt-5 lg:mt-0">
              <h2>{t("landing-page.our-history")}</h2>
              <p dangerouslySetInnerHTML={{ __html: t("landing-page.our-history-p-one") }} />
              <p>{t("landing-page.our-history-p-two")}</p>
            </div>
            <AssetPicture basePath="our-history" alt={t("landing-page.our-history")} className="our-history" />
          </div>
        </div>
        <div className="part-bottom">
          <div className="inner">
            <AssetPicture basePath="our-vision" alt={t("landing-page.our-vision")} className="our-vision" />

            <div className="text-group pb-0 sm:pb-5 md:pb-0">
              <h2>{t("landing-page.our-vision")}</h2>
              <p dangerouslySetInnerHTML={{ __html: t("landing-page.our-vision-p-one") }} />
              <p dangerouslySetInnerHTML={{ __html: t("landing-page.our-vision-p-two") }} />
            </div>
          </div>
        </div>
      </div>

      {/* Team & Footer */}
      <div className="sections sixth-section">
        <div className="part-top">
          <div className="inner">
            <div className="text-group">
              <h2>{t("landing-page.our-team")}</h2>
              <ul>
                <li className="last-element">
                  <Link href="/contributors">
                    {t("landing-page.community-contributors")}
                  </Link>
                  <Link href="/witnesses">{t("landing-page.blockchain-witnesses")}</Link>
                </li>
              </ul>
            </div>

            <div className="image-container">
              <AssetPicture basePath="our-team" alt={t("landing-page.our-team")} className="our-team together" />
            </div>
          </div>
        </div>
        <div className="part-bottom sm:pt-5 lg:pt-[auto]">
          <div className="inner">
            <div className="links-and-form">
              <div className="links">
                <ul className="first-column">
                  <li>
                    <Link href="#about">{t("landing-page.about")}</Link>
                  </li>
                  <li>
                    <Link href="/faq">{t("landing-page.faq")}</Link>
                  </li>
                  <li>
                    <Link href="/terms-of-service">
                      {t("landing-page.terms-of-service")}
                    </Link>
                  </li>
                  <li>
                    <Link href="/privacy-policy">{t("landing-page.privacy-policy")}</Link>
                  </li>
                </ul>
                <ul className="second-column">
                  <li>
                    <Link href="/discover">{t("landing-page.discover")}</Link>
                  </li>
                  <li>
                    <LandingSignInLink />
                  </li>
                  <li>
                    <Link href="/communities">{t("landing-page.communities")}</Link>
                  </li>
                  <li>
                    <Link href="/faq">{t("landing-page.help")}</Link>
                  </li>
                  <li>
                    <Link href="/mobile">{t("landing-page.get-mobile-app")}</Link>
                  </li>
                </ul>
              </div>

              <div className="subscribe-form">
                <h2>{t("landing-page.subscribe-us")}</h2>
                <LandingSubscribeForm />

                <p>{t("landing-page.subscribe-paragraph")}</p>

                <div className="socials w-full hidden lg:block">
                  <ul className="p-0 m-0 flex justify-between w-[50%]">
                    <li>
                      <Link href="https://youtube.com/ecency" target="_blank" rel="noopener noreferrer">
                        <SvgAsset path="footer-youtube.svg" alt="youtube" />
                      </Link>
                    </li>
                    <li>
                      <Link href="https://twitter.com/ecency_official" target="_blank" rel="noopener noreferrer">
                        <SvgAsset path="footer-twitter.svg" alt="twitter" />
                      </Link>
                    </li>
                    <li>
                      <Link href="https://t.me/ecency" target="_blank" rel="noopener noreferrer">
                        <SvgAsset path="footer-telegram.svg" alt="telegram" />
                      </Link>
                    </li>
                    <li>
                      <Link href="https://discord.me/ecency" target="_blank" rel="noopener noreferrer">
                        <SvgAsset path="footer-discord.svg" alt="discord" />
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="site-icon">
              <Link href="#">
                <Image width={100} height={100} src={defaults.logo} alt="ecency logo" />
              </Link>
              <p className="copy-right">{t("landing-page.copy-rights")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
