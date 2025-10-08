export const WAVES_FEED_SCROLL_STORAGE_KEY = "waves-feed-scroll";

export interface WavesFeedScrollState {
  scrollY: number;
  host?: string;
  grid?: string;
  url?: string;
  timestamp?: number;
}
