export interface VideoUploadResult {
  /** The full embed URL, e.g. https://play.3speak.tv/embed?v=user/abcd1234 */
  embedUrl: string;
  /** The video permlink (8-char ID) extracted from the embed URL */
  permlink: string;
}

export interface ThreeSpeakEmbedVideo {
  id: string;
  owner: string;
  permlink: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: number;
  views: number;
  created: string;
  status: string;
}
