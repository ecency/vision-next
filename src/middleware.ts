import { NextRequest } from "next/server";
import { handleEntriesRedirect } from "@/features/next-middleware";

export function middleware(request: NextRequest) {
  return handleEntriesRedirect(request);
}
