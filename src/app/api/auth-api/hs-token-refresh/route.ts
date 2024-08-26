import config from "@/config/ecency-config.json";
import { decodeToken } from "@/utils";

export async function POST(req: Request) {
  const hsSecret = config.visionConfig.service.hsClientSecret;
  if (hsSecret && !config.visionConfig.privateMode) {
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
