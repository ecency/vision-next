import { appAxios } from "@/api/axios";
import { apiBase } from "@/api/helper";
import { useMutation } from "@tanstack/react-query";
import { CreateIntentResult, StripeOrderStatusValue } from "./stripe-types";

// Premium Hive account, bought with a card. Mirrors ePoints STRIPE_PRODUCT_MAP
// ('299accounts' => $2.99, no Points). The price/SKU are authoritative server-side; the
// USD here is display-only.
export const STRIPE_ACCOUNT_SKU = "299accounts";
export const STRIPE_ACCOUNT_USD = 2.99;

export interface AccountPurchaseMeta {
  username: string;
  email: string;
  referral?: string;
}


export interface StripeAccountStatus {
  status: StripeOrderStatusValue | null;
  refunded?: boolean;
}

/**
 * Create a PaymentIntent for a premium account. UNLIKE the Points flow this is ANONYMOUS
 * (the buyer has no Hive account yet): there is no validateCode token. The human gate is the
 * Cloudflare Turnstile token; vapi verifies it server-side, then ePoints re-validates the
 * username (consensus syntax + on-chain availability) and computes the amount before charging.
 * The nonce is a stable per-checkout id so a double-submit returns the same intent.
 */
export function useCreateAccountIntent() {
  return useMutation({
    mutationKey: ["stripe-account-intent"],
    mutationFn: async ({
      meta,
      nonce,
      captchaToken
    }: {
      meta: AccountPurchaseMeta;
      nonce: string;
      captchaToken: string;
    }) => {
      const resp = await appAxios.post<CreateIntentResult>(
        apiBase("/private-api/stripe-account-intent"),
        { sku: STRIPE_ACCOUNT_SKU, nonce, meta, captcha_token: captchaToken }
      );
      return resp.data;
    }
  });
}

/**
 * Anonymous account-order status. Scoped by username + payment_intent (vapi forwards both;
 * ePoints filters by ?user, so it resolves only when both match the order it created). Polled
 * after the PaymentIntent is confirmed until the worker records the account request.
 */
export async function fetchStripeAccountStatus(
  username: string,
  paymentIntent: string
): Promise<StripeAccountStatus> {
  const resp = await appAxios.post<StripeAccountStatus>(
    apiBase("/private-api/stripe-account-status"),
    { username, payment_intent: paymentIntent }
  );
  return resp.data;
}
