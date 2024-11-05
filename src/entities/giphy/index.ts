export interface GiphyResponse {
  data: GiphyItem[];
  meta: Meta;
  pagination: Pagination;
}

interface GiphyItem {
  type: string;
  id: string;
  url: string;
  slug: string;
  bitly_gif_url: string;
  bitly_url: string;
  embed_url: string;
  username: string;
  source: string;
  title: string;
  rating: string;
  content_url: string;
  source_tld: string;
  source_post_url: string;
  is_sticker: number;
  import_datetime: string;
  trending_datetime: string;
  images: Images;
  user?: User;
  analytics_response_payload: string;
  analytics: Analytics;
  alt_text: string;
}

interface Images {
  original: Original;
  downsized: Downsized;
  downsized_large: DownsizedLarge;
  downsized_medium: DownsizedMedium;
  downsized_small: DownsizedSmall;
  downsized_still: DownsizedStill;
  fixed_height: FixedHeight;
  fixed_height_downsampled: FixedHeightDownsampled;
  fixed_height_small: FixedHeightSmall;
  fixed_height_small_still: FixedHeightSmallStill;
  fixed_height_still: FixedHeightStill;
  fixed_width: FixedWidth;
  fixed_width_downsampled: FixedWidthDownsampled;
  fixed_width_small: FixedWidthSmall;
  fixed_width_small_still: FixedWidthSmallStill;
  fixed_width_still: FixedWidthStill;
  looping: Looping;
  original_still: OriginalStill;
  original_mp4: OriginalMp4;
  preview: Preview;
  preview_gif: PreviewGif;
  preview_webp: PreviewWebp;
  hd?: Hd;
  "480w_still": N480wStill;
  "4k"?: N4k;
}

interface Original {
  height: string;
  width: string;
  size: string;
  url: string;
  mp4_size: string;
  mp4: string;
  webp_size: string;
  webp: string;
  frames: string;
  hash: string;
}

interface Downsized {
  height: string;
  width: string;
  size: string;
  url: string;
}

interface DownsizedLarge {
  height: string;
  width: string;
  size: string;
  url: string;
}

interface DownsizedMedium {
  height: string;
  width: string;
  size: string;
  url: string;
}

interface DownsizedSmall {
  height: string;
  width: string;
  mp4_size: string;
  mp4: string;
}

interface DownsizedStill {
  height: string;
  width: string;
  size: string;
  url: string;
}

interface FixedHeight {
  height: string;
  width: string;
  size: string;
  url: string;
  mp4_size: string;
  mp4: string;
  webp_size: string;
  webp: string;
}

interface FixedHeightDownsampled {
  height: string;
  width: string;
  size: string;
  url: string;
  webp_size: string;
  webp: string;
}

interface FixedHeightSmall {
  height: string;
  width: string;
  size: string;
  url: string;
  mp4_size: string;
  mp4: string;
  webp_size: string;
  webp: string;
}

interface FixedHeightSmallStill {
  height: string;
  width: string;
  size: string;
  url: string;
}

interface FixedHeightStill {
  height: string;
  width: string;
  size: string;
  url: string;
}

interface FixedWidth {
  height: string;
  width: string;
  size: string;
  url: string;
  mp4_size: string;
  mp4: string;
  webp_size: string;
  webp: string;
}

interface FixedWidthDownsampled {
  height: string;
  width: string;
  size: string;
  url: string;
  webp_size: string;
  webp: string;
}

interface FixedWidthSmall {
  height: string;
  width: string;
  size: string;
  url: string;
  mp4_size: string;
  mp4: string;
  webp_size: string;
  webp: string;
}

interface FixedWidthSmallStill {
  height: string;
  width: string;
  size: string;
  url: string;
}

interface FixedWidthStill {
  height: string;
  width: string;
  size: string;
  url: string;
}

interface Looping {
  mp4_size: string;
  mp4: string;
}

interface OriginalStill {
  height: string;
  width: string;
  size: string;
  url: string;
}

interface OriginalMp4 {
  height: string;
  width: string;
  mp4_size: string;
  mp4: string;
}

interface Preview {
  height: string;
  width: string;
  mp4_size: string;
  mp4: string;
}

interface PreviewGif {
  height: string;
  width: string;
  size: string;
  url: string;
}

interface PreviewWebp {
  height: string;
  width: string;
  size: string;
  url: string;
}

interface Hd {
  height: string;
  width: string;
  mp4_size: string;
  mp4: string;
}

interface N480wStill {
  height: string;
  width: string;
  size: string;
  url: string;
}

interface N4k {
  height: string;
  width: string;
  mp4_size: string;
  mp4: string;
}

interface User {
  avatar_url: string;
  banner_image: string;
  banner_url: string;
  profile_url: string;
  username: string;
  display_name: string;
  description: string;
  instagram_url: string;
  website_url: string;
  is_verified: boolean;
}

interface Analytics {
  onload: Onload;
  onclick: Onclick;
  onsent: Onsent;
}

interface Onload {
  url: string;
}

interface Onclick {
  url: string;
}

interface Onsent {
  url: string;
}

interface Meta {
  status: number;
  msg: string;
  response_id: string;
}

interface Pagination {
  total_count: number;
  count: number;
  offset: number;
}
