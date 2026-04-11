/**
 * Build a HiveSigner callback URL that routes through /auth/hs-callback.
 *
 * HiveSigner replaces {{id}}, {{block}}, {{txn}} template vars in the callback
 * URL after the user signs, so the callback handler can detect success.
 *
 * @param redirect - Where to redirect the user after the callback page (e.g., "/@user/wallet")
 */
export function buildHsCallbackUrl(redirect: string): string {
  const base = typeof window !== "undefined" ? window.location.origin : "https://ecency.com";
  const params = new URLSearchParams({
    id: "{{id}}",
    block: "{{block}}",
    redirect
  });
  return `${base}/auth/hs-callback?${params.toString()}`;
}
