"use client";

import { useState } from "react";
import i18next from "i18next";
import { Button } from "@ui/button";
import { alertCircleSvg } from "@/assets/img/svg";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import dynamic from "next/dynamic";
import { EcencyConfigManager } from "@/config";
import { useRcPrecheck } from "./use-rc-precheck";
import type { RcPrecheckOperation } from "@ecency/sdk";

// Lazy-load the purchase dialog so its mutation/SDK import chain is not pulled
// into every comment/editor/vote render until a user actually opens it.
const RcTopupDialog = dynamic(
  () => import("@/features/shared/rc-topup").then((m) => m.RcTopupDialog),
  { ssr: false }
);

interface Props {
  operation?: RcPrecheckOperation;
  /** Renders a single-line, tighter version for small surfaces (e.g. the vote popover). */
  compact?: boolean;
  className?: string;
}

/**
 * Non-blocking warning shown next to a publish/comment/vote action when the
 * active user's Resource Credits are likely too low to broadcast. Replaces the
 * cryptic post-broadcast "Please wait to transact" failure with a pre-emptive
 * nudge to top up. When the RC top-up product is live (visionFeatures.rcTopup)
 * the CTA opens the in-app RC top-up dialog; until then it falls back to the
 * Boost+ purchase page (HP delegation, which also adds RC). Renders nothing
 * when the user is logged out, the estimate is not ready, or RC is sufficient.
 */
export function RcPrecheckBanner({
  operation = "comment_operation",
  compact = false,
  className
}: Props) {
  const { activeUser } = useActiveAccount();
  const username = activeUser?.username;
  const { ready, willLikelyFail } = useRcPrecheck(username, operation);
  const [showTopup, setShowTopup] = useState(false);

  if (!username || !ready || !willLikelyFail) {
    return null;
  }

  const rcTopupEnabled = EcencyConfigManager.getConfigValue(
    ({ visionFeatures }) => visionFeatures.rcTopup.enabled
  );
  const onTopUp = () => {
    if (rcTopupEnabled) {
      setShowTopup(true);
    } else {
      window.open(`/purchase?username=${username}&type=boost`, "_blank", "noopener");
    }
  };

  const dialog = showTopup ? <RcTopupDialog onHide={() => setShowTopup(false)} /> : null;

  if (compact) {
    return (
      <>
        <div
          role="status"
          className={`flex items-center gap-2 rounded-lg border border-orange/30 bg-orange/10 px-2 py-1.5 text-xs ${
            className ?? ""
          }`}
        >
          <span className="shrink-0 text-orange">{alertCircleSvg}</span>
          <span className="flex-1">{i18next.t("rc-precheck.low-rc-short")}</span>
          <span
            role="button"
            tabIndex={0}
            className="shrink-0 cursor-pointer font-semibold text-orange hover:underline"
            onClick={onTopUp}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onTopUp();
              }
            }}
          >
            {i18next.t("rc-precheck.top-up")}
          </span>
        </div>
        {dialog}
      </>
    );
  }

  return (
    <>
      <div
        role="status"
        className={`flex flex-col gap-2 rounded-lg border border-orange/30 bg-orange/10 px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between ${
          className ?? ""
        }`}
      >
        <div className="flex items-start gap-2">
          <span className="mt-[2px] shrink-0 text-orange">{alertCircleSvg}</span>
          <span>{i18next.t("rc-precheck.low-rc-message")}</span>
        </div>
        <Button size="sm" appearance="warning" className="self-end sm:self-auto" onClick={onTopUp}>
          {i18next.t("rc-precheck.top-up")}
        </Button>
      </div>
      {dialog}
    </>
  );
}
