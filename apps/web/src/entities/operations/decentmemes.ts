import { BeneficiaryRoute } from "./beneficiary-route";

/**
 * Broadcast-ready meme attribution: unique template ids plus the aggregated
 * beneficiaries that get merged into comment_options.
 */
export interface DecentMemesPayload {
  templateIds: string[];
  beneficiaries: BeneficiaryRoute[];
}

/**
 * A single meme added to a composer, tracked with its hosted image URL so the
 * attribution can be dropped if the image is later removed from the body. Kept
 * in editor state / drafts; collapses to a {@link DecentMemesPayload} at publish.
 */
export interface DecentMemesEntry {
  templateId: string;
  imageUrl: string;
  beneficiaries: BeneficiaryRoute[];
}
