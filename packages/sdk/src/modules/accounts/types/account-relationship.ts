// Field set mirrors the bridge.get_relationship_between_accounts response.
export interface AccountRelationship {
  follows: boolean;
  ignores: boolean;
  blacklists: boolean;
  follows_muted: boolean;
  follows_blacklists: boolean;
}
