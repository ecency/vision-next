import { NextResponse } from "next/server";

/**
 * Health check endpoint for WebSocket configuration
 * Access at: /api/mattermost/websocket/health
 */
export async function GET() {
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
      next_ws_version: "Check package.json",
      upgrade_handler: "Registered"
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
