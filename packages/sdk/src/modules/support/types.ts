/**
 * A user's voluntary "Support Ecency" preferences.
 *
 * - `beneficiary_percent` - percent (0-100) of post rewards the user wants to
 *   route to @ecency as a post beneficiary on their new posts. The beneficiary
 *   weight in basis points equals `percent * 100`. 0 means off.
 * - `curation_percent` - percent (0-100) of the user's daily curation reward
 *   payout (as an @ecency delegator) they want held back by Ecency as support.
 *   0 means off.
 */
export interface SupportSettings {
  username: string;
  beneficiary_percent: number;
  curation_percent: number;
  /** ISO timestamps, present only when a settings row exists on the backend. */
  created?: string;
  modified?: string;
}

export interface UpdateSupportSettingsPayload {
  beneficiary_percent: number;
  curation_percent: number;
}
