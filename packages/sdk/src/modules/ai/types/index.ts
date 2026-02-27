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
