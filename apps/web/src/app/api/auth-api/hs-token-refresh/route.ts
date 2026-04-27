import { decodeToken } from "@/utils";
import { EcencyConfigManager } from "@/config";

export async function POST(req: Request) {
  const hsSecret = EcencyConfigManager.CONFIG.service.hsClientSecret;
  if (!hsSecret || Boolean(parseInt(EcencyConfigManager.CONFIG.privateMode, 10))) {
    return Response.json(
      { error: "Please, configure hivesigner client secret in configuration file based on template." },
      { status: 503 }
    );
  }

  let body: { code?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body.code !== "string" || !decodeToken(body.code)) {
    return Response.json({ error: "Code missed" }, { status: 400 });
  }

  const upstream = await fetch(
    `https://hivesigner.com/api/oauth2/token?code=${encodeURIComponent(body.code)}&client_secret=${encodeURIComponent(hsSecret)}`
  );

  return Response.json(await upstream.json(), { status: upstream.status });
}
