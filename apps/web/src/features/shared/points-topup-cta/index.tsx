"use client";

import {
  DEFAULT_STRIPE_TIER_SKU,
  STRIPE_POINTS_TIERS,
  isStripeEnabled
} from "@/features/shared/purchase-stripe/stripe-config";
import { Button } from "@ui/button";
import i18next from "i18next";
import { useMemo } from "react";

interface Props {
  /** Points the intended action costs. Together with `available` it picks a tier covering the gap. */
  required?: number;
  /** The user's current Points balance. */
  available?: number;
  className?: string;
  /** Open the top-up page in a new tab (use inside the editor so a draft in progress isn't lost). */
  newTab?: boolean;
}

/**
 * Smallest card tier whose Points cover the deficit; largest tier when even that
 * falls short. Undefined when there is no deficit to cover.
 */
export function suggestPointsSkuForDeficit(deficit: number): string | undefined {
  if (!Number.isFinite(deficit) || deficit <= 0) {
    return undefined;
  }
  return (
    STRIPE_POINTS_TIERS.find((tier) => tier.points >= deficit) ??
    STRIPE_POINTS_TIERS[STRIPE_POINTS_TIERS.length - 1]
  ).sku;
}

/**
 * "Get more Points" call-to-action for insufficient-balance states. Deep-links into
 * the card checkout on /perks/points with a tier preselected to cover the deficit;
 * when card payment is unavailable it still lands on the top-up hub (QR/HIVE rails).
 */
export function PointsTopupCta({ required, available, className, newTab }: Props) {
  const href = useMemo(() => {
    if (!isStripeEnabled()) {
      return "/perks/points";
    }
    const deficit = (required ?? 0) - (available ?? 0);
    const sku = suggestPointsSkuForDeficit(deficit) ?? DEFAULT_STRIPE_TIER_SKU;
    return `/perks/points?buy=card&sku=${sku}`;
  }, [required, available]);

  return (
    <Button
      href={href}
      target={newTab ? "_blank" : undefined}
      size="sm"
      outline={true}
      className={className}
    >
      {i18next.t("points.get-more")}
    </Button>
  );
}
