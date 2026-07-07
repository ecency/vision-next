import { appAxios } from "@/api/axios";
import { apiBase } from "@/api/helper";
import { ensureValidToken } from "@/utils";
import { useMutation } from "@tanstack/react-query";

export interface CreateIntentResult {
  client_secret: string;
}

export type StripeOrderStatusValue = "pending" | "processing" | "success" | "failed";

export interface StripeOrderStatus {
  status: StripeOrderStatusValue | null;
  points?: number;
  refunded?: boolean;
}

/**
 * Create a PaymentIntent for a Points SKU. Routes through vapi (validateCode-gated)
 * which forwards to ePoints with the internal shared secret. `user`, the price and the
 * Points are all decided server-side; we only send the SKU and a stable per-checkout
 * nonce (so a double-submit returns the same intent instead of charging twice). Credits
 * the authenticated user.
 *
 * `hosting_target` is optional and only meaningful on the hosting rail: it activates a
 * DIFFERENT tenant than the buyer (e.g. a community hive-NNNNN whose owner pays). The order
 * still binds to the authenticated `username` (the payer); only the activated tenant differs.
 * ePoints validates it and ignores it on every non-hosting rail.
 */
export function useCreateStripeIntent(username?: string) {
  return useMutation({
    mutationKey: ["stripe-create-intent", username],
    mutationFn: async ({
      sku,
      nonce,
      hosting_target
    }: {
      sku: string;
      nonce: string;
      hosting_target?: string;
    }) => {
      // Await the background token refresh first (a long-lived session can hold a stale
      // token that getAccessToken would return as-is, failing this first call).
      const code = await ensureValidToken(username ?? "");
      if (!code) {
        throw new Error("stripe-points.not-authenticated");
      }
      const resp = await appAxios.post<CreateIntentResult>(
        apiBase("/private-api/stripe-create-intent"),
        { code, sku, nonce, hosting_target }
      );
      return resp.data;
    }
  });
}

/**
 * Owner-scoped order status (vapi forwards ?user = the validated caller). Polled after
 * the PaymentIntent is confirmed, until the worker delivers (status "success").
 */
export async function fetchStripeOrderStatus(
  username: string,
  paymentIntent: string
): Promise<StripeOrderStatus> {
  const code = await ensureValidToken(username);
  if (!code) {
    throw new Error("stripe-points.not-authenticated");
  }
  const resp = await appAxios.post<StripeOrderStatus>(
    apiBase("/private-api/stripe-order-status"),
    { code, payment_intent: paymentIntent }
  );
  return resp.data;
}
