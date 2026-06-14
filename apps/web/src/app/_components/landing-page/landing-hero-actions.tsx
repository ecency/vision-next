"use client";

import Link from "next/link";
import i18next from "i18next";

export function LandingHeroActions() {
  return (
    <>
      <div className="flex flex-wrap justify-center items-center gap-3 mt-8">
        <Link
          className="get-started inline-flex items-center justify-center h-12 px-7 rounded-full bg-blue-dark-sky text-white font-semibold hover:bg-blue-dark-sky-hover transition-colors"
          href="/signup?referral=ecency"
        >
          {i18next.t("landing-page.get-started")}
        </Link>
        <Link
          href="/hot"
          className="get-started secondary inline-flex items-center justify-center h-12 px-7 rounded-full border-2 border-blue-dark-sky text-blue-dark-sky font-semibold hover:bg-blue-dark-sky hover:text-white transition-colors"
        >
          {i18next.t("landing-page.explore")}
        </Link>
      </div>
      <button
        type="button"
        className="scroll-down mt-8 mx-auto block text-blue-dark-sky dark:text-gray-pinkish animate-bounce cursor-pointer"
        aria-label={i18next.t("landing-page.scroll-down")}
        onClick={() =>
          window.scrollBy({ top: Math.round(window.innerHeight * 0.9), behavior: "smooth" })
        }
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="m6 9 6 6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </>
  );
}
