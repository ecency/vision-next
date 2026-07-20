// Optional AI-usage disclosure. Interoperable with the `ai_tools` json_metadata convention
// used by other Hive frontends, so an AI-usage badge shows consistently across them. Every
// key is an optional boolean and the whole object is omitted when nothing is disclosed.
export interface AiToolsMeta {
  media_generation?: boolean; // AI-generated image/media
  writing_edit?: boolean; // AI grammar/formatting/editing assistance
}

// A type alias, not an interface, on purpose: only aliases get TypeScript's
// implicit index signature, which is what lets this be passed to the SDK
// helpers that take Record<string, unknown>. As an interface every call site
// needs an `as unknown as Record<string, unknown>` cast.
export type MetaData = {
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
