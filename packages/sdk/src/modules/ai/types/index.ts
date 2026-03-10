export interface AiGenerationPrice {
  aspect_ratio: string;
  cost: number;
}

export interface AiGenerationRequest {
  prompt: string;
  aspect_ratio?: string;
}

export interface AiGenerationResponse {
  url: string;
  prompt: string;
  aspect_ratio: string;
  cost: number;
  generation_id: string;
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
}
