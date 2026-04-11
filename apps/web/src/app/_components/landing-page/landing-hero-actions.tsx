"use client";

import Link from "next/link";
import i18next from "i18next";
import { scrollDown } from "@ui/svg";

export function LandingHeroActions() {
  return (
    <>
      <div className="flex justify-center items-center mt-10">
        <Link href="/hot" className="get-started mr-5">
          {i18next.t("landing-page.explore")}
        </Link>
        <Link className="get-started ml-5 link-btn" href="/signup?referral=ecency">
          {i18next.t("landing-page.get-started")}
        </Link>
      </div>
      <button
        type="button"
        className="scroll-down cursor-pointer"
        aria-label="Scroll to Earn Money"
        onClick={() =>
          document.getElementById("earn-money")?.scrollIntoView({ behavior: "smooth" })
        }
      >
        {scrollDown}
      </button>
    </>
  );
}
