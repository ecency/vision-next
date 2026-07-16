import { NextRequest } from "next/server";
import { resolveUser, unauthorizedResponse } from "../../../threespeak/resolve-user";
import {
  callHostingInternal,
  hostingInternalSecret,
  resolveOwnedTenant
} from "@/server/hosting-internal";

/**
 * Run the DNS check for the authenticated user's pending custom domain. Identity comes from a
 * HiveSigner access token (`body.code`); the internal secret guards the hosting endpoint.
 */
export async function POST(request: NextRequest) {
  const secret = hostingInternalSecret();
  if (!secret) {
    return Response.json({ error: "Hosting is not configured" }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
    if (typeof body !== "object" || body === null) {
      return Response.json({ error: "Invalid request body" }, { status: 400 });
    }
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const auth = await resolveUser(request, body);
  if (!auth.ok) {
    return unauthorizedResponse(auth.reason);
  }

  // Optional body.tenant targets a tenant the caller owns but that isn't their personal blog
  // (a community instance); ownership is verified against the hosting service.
  const target = await resolveOwnedTenant(body.tenant, auth.username.toLowerCase());
  if (!target.ok) {
    return Response.json({ error: target.error }, { status: target.status });
  }

  let upstream: Response;
  try {
    upstream = await callHostingInternal("/v1/internal/domain/verify", secret, {
      username: target.username
    });
  } catch {
    return Response.json({ error: "Hosting service unavailable" }, { status: 502 });
  }

  const data = await upstream.json().catch(() => ({}));
  return Response.json(data, { status: upstream.status });
}
