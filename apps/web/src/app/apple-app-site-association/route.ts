import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    applinks: {
      apps: [],
      details: [
        {
          appID: "75B6RXTKGT.app.esteem.mobile.ios",
          paths: [
            "/@*",
            "/*/@*/*",
            "/hot/*",
            "/trending/*",
            "/created/*",
            "/hot",
            "/trending",
            "/created"
          ]
        }
      ]
    }
  });
}
