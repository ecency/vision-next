// Shared between the points and account purchase hooks. Kept in its own
// dependency-free module so both can use one declaration: duplicating them
// made the feature barrel re-export the same names from two places.

export interface CreateIntentResult {
  client_secret: string;
}

export type StripeOrderStatusValue = "pending" | "processing" | "success" | "failed";
