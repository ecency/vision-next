"use client";

import {
  DEFAULT_STRIPE_TIER_SKU,
  isStripeEnabled,
  suggestPointsSkuForDeficit
} from "@/features/shared/purchase-stripe/stripe-tiers";
import { Button } from "@ui/button";
import i18next from "i18next";

interface Props {
  /** Points the intended action costs. Together with `available` it picks a tier covering the gap. */
  required?: number;
  /** The user's current Points balance. */
  available?: number;
  className?: string;
}

/**
 * "Get more Points" call-to-action for insufficient-balance states. Deep-links into
 * the card checkout on /perks/points with a tier preselected to cover the deficit;
 * when card payment is unavailable it still lands on the top-up hub (QR/HIVE rails).
 *
 * Always opens in a new tab so an in-progress flow (a draft in the editor, a filled
 * Boost/Promote form) is never discarded, and so the checkout page mounts fresh and
 * consumes the deep-link params reliably.
 */
export function PointsTopupCta({ required, available, className }: Props) {
  let href = "/perks/points";
  if (isStripeEnabled()) {
    const deficit = (required ?? 0) - (available ?? 0);
    const sku = suggestPointsSkuForDeficit(deficit) ?? DEFAULT_STRIPE_TIER_SKU;
    href = `/perks/points?buy=card&sku=${sku}`;
  }

  return (
    <Button
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      size="sm"
      outline={true}
      className={className}
    >
      {i18next.t("points.get-more")}
    </Button>
  );
}
