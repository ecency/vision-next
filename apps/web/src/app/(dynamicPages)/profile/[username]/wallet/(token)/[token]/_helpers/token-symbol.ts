import { safeDecodeURIComponent } from "@/utils";

export const normalizeTokenSymbol = (token?: string) => {
  if (!token) {
    return "";
  }

  const decoded = safeDecodeURIComponent(token);

  return decoded.trim().replace(/\s+/g, " ").toUpperCase();
};
