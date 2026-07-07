// Thin client for the managed blog-hosting API (a separate service from vapi). CORS on
// that service already allows ecency.com. The base URL is configured per-environment; the
// signup page is hidden when it is unset.

// The managed-hosting API is a stable public service; default to it so /hosting works without
// a build-time env. Override with NEXT_PUBLIC_HOSTING_API (e.g. "" to force the coming-soon gate).
const HOSTING_API = (process.env.NEXT_PUBLIC_HOSTING_API ?? "https://api.blogs.ecency.com").replace(
  /\/$/,
  ""
);

export interface HostingPaymentMethods {
  hbd: { enabled: boolean; monthly: string; account: string };
  x402: { enabled: boolean; monthly: string };
  card: { enabled: boolean; monthlyUsdCents: number };
}

export interface HostingConfigInput {
  theme?: "light" | "dark" | "system";
  styleTemplate?: string;
  title?: string;
  description?: string;
}

export interface CreateTenantResult {
  tenant: { username: string; subscriptionStatus: string; blogUrl: string };
  paymentInstructions: { to: string; amount: string; memo: string; note?: string };
}

export interface TenantInfo {
  username: string;
  subscriptionStatus: "active" | "inactive" | "expired" | "suspended";
  subscriptionExpiresAt?: string | null;
  blogUrl?: string;
}

async function parseError(r: Response): Promise<string> {
  try {
    const data = await r.json();
    return (data && (data.error || data.message)) || `HTTP ${r.status}`;
  } catch {
    return `HTTP ${r.status}`;
  }
}

async function get<T>(path: string): Promise<T> {
  const r = await fetch(`${HOSTING_API}${path}`, { headers: { Accept: "application/json" } });
  if (!r.ok) throw new Error(await parseError(r));
  return r.json() as Promise<T>;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch(`${HOSTING_API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error(await parseError(r));
  return r.json() as Promise<T>;
}

export const hostingApi = {
  /** The signup page only renders when the service URL is configured. */
  isConfigured: () => HOSTING_API.length > 0,

  paymentMethods: () => get<HostingPaymentMethods>("/v1/payments/methods"),

  /** Create the (inactive) tenant. Payment then activates it. */
  createTenant: (username: string, config?: HostingConfigInput) =>
    post<CreateTenantResult>("/v1/tenants", { username, config }),

  tenant: (username: string) => get<TenantInfo>(`/v1/tenants/${encodeURIComponent(username)}`),

  /** HBD payment instructions for a given term. */
  paymentInstructions: (username: string, months: number) =>
    get<{ to: string; amount: string; memo: string; totalAmount: string; instructions: string[] }>(
      `/v1/payments/instructions/${encodeURIComponent(username)}?months=${months}`
    )
};

/** SKU the ePoints Stripe rail expects for a hosting term (leading number = price in cents). */
export function hostingSkuForMonths(months: number): string {
  switch (months) {
    case 3:
      return "600hosting";
    case 6:
      return "1200hosting";
    case 12:
      return "2400hosting";
    default:
      return "200hosting";
  }
}

/**
 * SKU for the Custom domain plan (hosting + your own domain) for a given term. Priced at
 * $3/mo (leading number = price in cents), which the ePoints rail activates on the internal
 * `pro` plan so custom domains unlock. Kept separate from the standard `*hosting` SKUs above.
 */
export function hostingProSkuForMonths(months: number): string {
  switch (months) {
    case 3:
      return "900prohosting";
    case 6:
      return "1800prohosting";
    case 12:
      return "3600prohosting";
    default:
      return "300prohosting";
  }
}

/** Standard hosting monthly price in USD (subdomain included). */
export const HOSTING_MONTHLY_USD = 2;
/** Custom domain plan monthly price in USD (standard + your own domain, +$1/mo). */
export const HOSTING_CUSTOM_DOMAIN_MONTHLY_USD = 3;
