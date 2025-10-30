import { safeDecodeURIComponent } from "@/utils";

const SPK_LAYER_TOKEN_SYMBOLS = new Set(["SPK", "LARYNX", "LP"]);

export const normalizeTokenSymbol = (token?: string) => {
  if (!token) {
    return "";
  }

  const decoded = safeDecodeURIComponent(token);

  return decoded.trim().replace(/\s+/g, " ").toUpperCase();
};

export const isSpkLayerTokenSymbol = (token?: string) => {
  const normalizedSymbol = normalizeTokenSymbol(token);

  return normalizedSymbol ? SPK_LAYER_TOKEN_SYMBOLS.has(normalizedSymbol) : false;
};
