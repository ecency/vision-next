import { NextRequest, NextResponse } from "next/server";

export function isRssXmlRequest(request: NextRequest) {
  return request.nextUrl.pathname.includes("rss.xml");
}

export function handleRssRewrite(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = request.nextUrl.pathname.replace(".xml", "");
  return NextResponse.rewrite(url);
}
