import { Entry } from "./entry";

export interface ThreadItemEntry extends Entry {
  host: string;
  container: WaveEntry;
  // Is this entry had been replied to another one
  parent?: Entry;
}

export type WaveEntry = ThreadItemEntry & Required<Pick<Entry, "id">>;

export interface WaveTrendingTag {
  tag: string;
  posts: number;
}
