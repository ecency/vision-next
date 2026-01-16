export interface RPCError extends Error {
  jse_info?: Record<string, string>;
  jse_shortmsg?: string;
  name: string;
  message: string;
}

export function parseRpcInfo(
  jseInfo: Record<string, string> | undefined
): string | null {
  if (!jseInfo) return null;
  try {
    return Object.values(jseInfo).join("");
  } catch {
    return null;
  }
}

export function isRpcError(err: unknown): err is RPCError {
  return (
    typeof err === "object" && err !== null && "message" in err && "name" in err
  );
}
