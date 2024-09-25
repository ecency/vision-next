import { NextRequest } from "next/server";
import {
  handleEntriesRedirect,
  handleIndexRedirect,
  isEntriesRedirect,
  isIndexRedirect
} from "@/features/next-middleware";

export function middleware(request: NextRequest) {
  if (isIndexRedirect(request)) {
    return handleIndexRedirect(request);
  }

  if (isEntriesRedirect(request)) {
    return handleEntriesRedirect(request);
  }
}
