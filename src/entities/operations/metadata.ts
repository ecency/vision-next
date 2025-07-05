export interface MetaData {
  image?: string[];
  image_ratios?: any;
  thumbnails?: string[];
  tags?: string[];
  app?: string;
  format?: string;
  community?: string;
  description?: string | null;
  video?: any;
  type?: string;
  pinned_reply?: string; // author/permlink
  links?: string[];
  links_meta?: Record<string, { image: string; summary: string; title: string }>;
  location?: { coordinates: { lat: number; lng: number }; address?: string };
}
