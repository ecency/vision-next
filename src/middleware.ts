import { NextRequest } from "next/server";
import {
  handleEntriesRedirect,
  handleIndexRedirect,
  handleRssRewrite,
  isEntriesRedirect,
  isIndexRedirect,
  isRssXmlRequest
} from "@/features/next-middleware";

export function middleware(request: NextRequest) {
  if (isRssXmlRequest(request)) {
    return handleRssRewrite(request);
  }

  if (isIndexRedirect(request)) {
    return handleIndexRedirect(request);
  }

  if (isEntriesRedirect(request)) {
    return handleEntriesRedirect(request);
  }
}
