/**
 * Account profile information from bridge API
 * Returned by get_profiles endpoint
 */
export interface Profile {
  id: number;
  name: string;
  created: string;
  active: string;
  post_count: number;
  reputation: number;
  blacklists: string[];
  stats: {
    rank: number;
    following: number;
    followers: number;
  };
  metadata: {
    profile: {
      about?: string;
      blacklist_description?: string;
      cover_image?: string;
      location?: string;
      muted_list_description?: string;
      name?: string;
      profile_image?: string;
      website?: string;
    };
  };
}
