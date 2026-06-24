import { aggregateMemeBeneficiaries } from "./beneficiary";
import { DecentMemesEntry, DecentMemesPayload } from "./types";

/**
 * Reconcile tracked memes against the actual post body: keep only the memes
 * whose hosted image is still present, then collapse them into a broadcast
 * payload (unique template ids + summed beneficiaries). If the user deleted a
 * meme image, its template id and beneficiaries are dropped here so they never
 * reach the broadcast.
 */
export function collectPresentMemeAttribution(
  entries: DecentMemesEntry[] = [],
  body: string = ""
): DecentMemesPayload {
  const present = entries.filter((m) => m?.imageUrl && body.includes(m.imageUrl));
  const templateIds = Array.from(new Set(present.map((m) => m.templateId).filter(Boolean)));
  const beneficiaries = aggregateMemeBeneficiaries(present.flatMap((m) => m.beneficiaries ?? []));
  return { templateIds, beneficiaries };
}
