"use client";

import Link from "next/link";
import i18next from "i18next";
import { scrollDown } from "@ui/svg";

export function LandingHeroActions() {
  return (
    <>
      <div className="flex justify-center items-center gap-4 mt-10">
        <Link className="get-started" href="/signup?referral=ecency">
          {i18next.t("landing-page.get-started")}
        </Link>
        <Link href="/hot" className="get-started secondary">
          {i18next.t("landing-page.explore")}
        </Link>
      </div>
      <button
        type="button"
        className="scroll-down cursor-pointer"
        aria-label="Scroll down"
        onClick={() =>
          window.scrollBy({ top: Math.round(window.innerHeight * 0.9), behavior: "smooth" })
        }
      >
        {scrollDown}
      </button>
    </>
  );
}
