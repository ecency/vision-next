import { NextRequest } from "next/server";
import { handleIndexRedirect, isIndexRedirect } from "@/features/next-middleware";

export function middleware(request: NextRequest) {
  if (isIndexRedirect(request)) {
    return handleIndexRedirect(request);
  }
}
