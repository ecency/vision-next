/**
 * Friends list row data
 * The `active` field contains raw timestamp - app should format it
 */
export interface FriendsRow {
  name: string;
  reputation: number;
  active: string; // Raw timestamp
}

/**
 * Friend search result with additional profile information
 * The `active` field contains raw timestamp - app should format it
 */
export interface FriendSearchResult {
  name: string;
  full_name: string;
  reputation: number;
  active: string; // Raw timestamp
}
