// Optional AI-usage disclosure. Interoperable with the `ai_tools` json_metadata convention
// used by other Hive frontends, so an AI-usage badge shows consistently across them. Every
// key is an optional boolean and the whole object is omitted when nothing is disclosed.
export interface AiToolsMeta {
  media_generation?: boolean; // AI-generated image/media
  writing_edit?: boolean; // AI grammar/formatting/editing assistance
}

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
  decentmemes?: { v: number; templateIds: string[]; frontend?: string };
  ai_tools?: AiToolsMeta;
}
