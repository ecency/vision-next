import { NextRequest } from "next/server";
import { handleEntriesRedirect, isEntriesRedirect } from "@/features/next-middleware";

export function middleware(request: NextRequest) {
  if (isEntriesRedirect(request)) {
    return handleEntriesRedirect(request);
  }
}
