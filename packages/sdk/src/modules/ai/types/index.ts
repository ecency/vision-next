export interface AiGenerationPrice {
  aspect_ratio: string;
  cost: number;
}

export interface AiImagePowerTier {
  power: number;
  multiplier: number;
}

export interface AiImagePriceResponse {
  prices: AiGenerationPrice[];
  power: AiImagePowerTier[];
}

export interface AiGenerationRequest {
  prompt: string;
  aspect_ratio?: string;
  power?: number;
  // Reused across retries so the backend recovers a paid-but-undelivered generation
  // instead of creating (and billing) a second prediction.
  idempotency_key?: string;
}

export interface AiGenerationResponse {
  url: string;
  prompt: string;
  aspect_ratio: string;
  power: number;
  cost: number;
  generation_id: string;
  // True when the backend replayed a previously-generated image for this idempotency_key
  // (no new charge, no new vendor call).
  idempotent_replay?: boolean;
}

export interface AiAssistPrice {
  action: string;
  cost: number;
  free_limit: number;
  free_remaining?: number;
}

export interface AiAssistResponse {
  action: string;
  output: string;
  cost: number;
  is_free: boolean;
  request_id: string;
  // true when the backend deduped a duplicate POST against an earlier
  // successful request with the same idempotency_key. Cost is 0 in that case.
  idempotent_replay?: boolean;
}
