import { existsSync, readFileSync } from "fs";
import { dirname, join } from "path";
import { NextResponse } from "next/server";

type PatchTrace = {
  patch?: string;
  version?: string;
};

function getPatchStatus() {
  try {
    // Use dynamic require for CommonJS compatibility
    const path = require("path");
    const nextPackagePath = path.join(process.cwd(), "node_modules", "next", "package.json");
    const nextWsPackagePath = path.join(process.cwd(), "node_modules", "next-ws", "package.json");
    const tracePath = path.join(process.cwd(), "node_modules", "next", ".next-ws-trace.json");

    let trace: PatchTrace | null = null;
    let traceError: string | null = null;

    if (existsSync(tracePath)) {
      try {
        trace = JSON.parse(readFileSync(tracePath, "utf8")) as PatchTrace;
      } catch (error) {
        traceError = error instanceof Error ? error.message : "Unknown trace parse error";
      }
    } else {
      traceError = "Trace file not found";
    }

    const nextVersion = existsSync(nextPackagePath)
      ? JSON.parse(readFileSync(nextPackagePath, "utf8")).version
      : "unknown";

    const nextWsVersion = existsSync(nextWsPackagePath)
      ? JSON.parse(readFileSync(nextWsPackagePath, "utf8")).version
      : "unknown";

    return {
      tracePath,
      nextVersion,
      nextWsVersion,
      patchApplied: Boolean(trace?.patch) && Boolean(trace?.version),
      traceError,
      trace
    };
  } catch (error) {
    return {
      tracePath: "error",
      nextVersion: "error",
      nextWsVersion: "error",
      patchApplied: false,
      traceError: error instanceof Error ? error.message : "Unknown error",
      trace: null
    };
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Health check endpoint for WebSocket configuration
 * Access at: /api/mattermost/websocket/health
 */
export async function GET() {
  const patchStatus = getPatchStatus();

  const checks = {
    timestamp: new Date().toISOString(),
    environment: {
      MATTERMOST_BASE_URL: process.env.MATTERMOST_BASE_URL ? "✓ Set" : "✗ Missing",
      MATTERMOST_ADMIN_TOKEN: process.env.MATTERMOST_ADMIN_TOKEN ? "✓ Set" : "✗ Missing",
      NODE_ENV: process.env.NODE_ENV
    },
    websocket: {
      route_exists: true,
      runtime: "nodejs",
      next_version: patchStatus.nextVersion,
      next_ws_version: patchStatus.nextWsVersion,
      upgrade_handler: "Registered",
      patch: {
        applied: patchStatus.patchApplied,
        trace_path: patchStatus.tracePath,
        trace: patchStatus.trace,
        error: patchStatus.traceError
      }
    },
    instructions: {
      if_connection_fails: [
        "1. Run 'pnpm next-ws patch' on server",
        "2. Configure nginx for WebSocket (see /api/mattermost/websocket/health)",
        "3. Restart Next.js server",
        "4. Check browser console for detailed error"
      ],
      nginx_config_required: `
location /api/mattermost/websocket {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_read_timeout 86400;
}
      `.trim()
    }
  };

  return NextResponse.json(checks, {
    status: 200,
    headers: {
      "Content-Type": "application/json"
    }
  });
}
