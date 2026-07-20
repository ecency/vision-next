import { BeneficiaryRoute } from "./beneficiary-route";

// A type alias, not an interface, on purpose: only aliases get TypeScript's
// implicit index signature, which is what lets this be passed to the SDK
// broadcast helpers that take Record<string, unknown>. As an interface every
// call site needs an `as unknown as Record<string, unknown>` cast.
export type CommentOptions = {
  allow_curation_rewards: boolean;
  allow_votes: boolean;
  author: string;
  permlink: string;
  max_accepted_payout: string;
  percent_hbd: number;
  extensions: Array<[0, { beneficiaries: BeneficiaryRoute[] }]>;
}
