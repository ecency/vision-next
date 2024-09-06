import { decodeToken } from "@/utils";
import { EcencyConfigManager } from "@/config";

export async function POST(req: Request) {
  const hsSecret = EcencyConfigManager.CONFIG.service.hsClientSecret;
  if (hsSecret && !Boolean(parseInt(EcencyConfigManager.CONFIG.privateMode, 10))) {
    const body = await req.json();
    if (!decodeToken(body.code)) {
      Response.json({
        error: "Code missed"
      });
    }

    const response = await fetch(
      `https://hivesigner.com/api/oauth2/token?code=${body.code}&client_secret=${hsSecret}`
    );
    return Response.json(await response.json(), { ...response });
  } else {
    Response.json({
      error: "Please, configure hivesigner client secret in configuration file based on template."
    });
  }

  return Response.json({ status: "ok" });
}
