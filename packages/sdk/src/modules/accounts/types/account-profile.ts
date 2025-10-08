export interface AccountProfile {
  about?: string;
  cover_image?: string;
  location?: string;
  name?: string;
  profile_image?: string;
  website?: string;
  pinned?: string;
  reputation?: number;

  // Community's default beneficiary settings
  beneficiary?: {
    account: string;
    weight: number;
  };
  tokens?: { symbol: string; type: string; meta: Record<string, any> }[];
}
