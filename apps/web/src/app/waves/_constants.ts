export const WAVES_FEED_SCROLL_STORAGE_KEY = "waves-feed-scroll";

export type WavesFeedType = "for-you" | "following";

export interface WavesFeedScrollState {
  scrollY: number;
  host?: string;
  url?: string;
  timestamp?: number;
  feedType?: WavesFeedType;
}
