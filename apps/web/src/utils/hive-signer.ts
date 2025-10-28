import hs from "hivesigner";
import { decode as decodeHiveUri } from "hive-uri";

import { b64uEnc } from "./b64";
import { getAccessToken } from "./user-token";
import { HiveSignerMessage } from "@/types";
import { broadcastWithHiveAuth, shouldUseHiveAuth } from "@/utils";
import type { Operation } from "@hiveio/dhive";

export function getAuthUrl(app: string, redir: string = `${window.location.origin}/auth`) {
  const scope =
    "vote,comment,delete_comment,comment_options,custom_json,claim_reward_balance,offline";

  return `https://hivesigner.com/oauth2/authorize?client_id=${app}&redirect_uri=${encodeURIComponent(
    redir
  )}&response_type=code&scope=${encodeURIComponent(scope)}`;
}

export function getTokenUrl(code: string, secret: string) {
  return `https://hivesigner.com/api/oauth2/token?code=${code}&client_secret=${secret}`;
}

export function getDecodedMemo(username: string, memo: string): Promise<any> {
  // With hivesigner access token
  let token = getAccessToken(username);
  return token
    ? new hs.Client({
        accessToken: token
      })
        .decode(memo)
        .then((r: any) => r)
    : Promise.resolve(0);
}

export function decodeToken(code: string): HiveSignerMessage | null {
  const buff = Buffer.from(code, "base64");
  try {
    const s = buff.toString("ascii");
    return JSON.parse(s);
  } catch (e) {
    return null;
  }
}

export function validateToken(code: string | null): boolean {
  if (!code) {
    return false;
  }

  const dt = decodeToken(code);
  const sevenDaysAgo: Date = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  if (dt) {
    if (new Date(dt.timestamp * 1000) > sevenDaysAgo) {
      return true;
    }
  }
  return false;
}

export async function makeHsCode(
  hsClientId: string,
  account: string,
  signer: (message: string) => Promise<string>
): Promise<string> {
  const timestamp = Math.floor(Date.now() / 1000);

  const messageObj: HiveSignerMessage = {
    signed_message: { type: "code", app: hsClientId },
    authors: [account],
    timestamp
  };

  const message = JSON.stringify(messageObj);

  const signature = await signer(message);

  messageObj.signatures = [signature];

  return b64uEnc(JSON.stringify(messageObj));
}

export function buildHotSignUrl(
  endpoint: string,
  params: {
    [key: string]: string;
  },
  redirect: string
): any {
  const _params = {
    ...params,
    redirect_uri: `https://ecency.com/${redirect}`
  };

  const queryString = new URLSearchParams(_params).toString();
  return `https://hivesigner.com/sign/${endpoint}?${queryString}`;
}

function parseJsonArray(value: any): string[] {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.error("Failed to parse HiveAuth array parameter", err);
    }
  }

  return [];
}

function toBoolean(value: any): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value.toLowerCase() === "true";
  }

  return Boolean(value);
}

function determineKeyType(
  operations: Operation[],
  explicitAuthority?: string
): "posting" | "active" {
  if (explicitAuthority) {
    return explicitAuthority.toLowerCase() === "active" ? "active" : "posting";
  }

  for (const [opName, opPayload] of operations) {
    if (opName === "custom_json") {
      const payload = opPayload as unknown as {
        required_posting_auths?: string[];
        required_auths?: string[];
      };
      if (payload?.required_posting_auths && payload.required_posting_auths.length > 0) {
        return "posting";
      }

      return "active";
    }

    if (
      opName === "vote" ||
      opName === "comment" ||
      opName === "comment_options" ||
      opName === "delete_comment" ||
      opName === "claim_reward_balance"
    ) {
      return "posting";
    }

    return "active";
  }

  return "posting";
}

function extractSignerFromOperations(
  operations: Operation[],
  params: Record<string, any>
): string | null {
  for (const [opName, opPayload] of operations) {
    const payload = opPayload as any;
    switch (opName) {
      case "custom_json": {
        if (Array.isArray(payload?.required_posting_auths) && payload.required_posting_auths.length > 0) {
          return payload.required_posting_auths[0];
        }

        if (Array.isArray(payload?.required_auths) && payload.required_auths.length > 0) {
          return payload.required_auths[0];
        }
        break;
      }
      case "account_witness_vote":
      case "account_witness_proxy":
        return payload?.account ?? null;
      case "update_proposal_votes":
        return payload?.voter ?? null;
      case "claim_account":
        return payload?.creator ?? null;
      default: {
        if (typeof payload?.from === "string") {
          return payload.from;
        }
        if (typeof payload?.account === "string") {
          return payload.account;
        }
      }
    }
  }

  if (typeof params.account === "string") {
    return params.account;
  }
  if (typeof params.from === "string") {
    return params.from;
  }

  return null;
}

type HiveAuthContext = {
  username: string;
  keyType: "posting" | "active";
  operations: Operation[];
};

function buildCustomJsonContext(params: Record<string, any>): HiveAuthContext | null {
  const requiredAuths = parseJsonArray(params.required_auths);
  const requiredPostingAuths = parseJsonArray(params.required_posting_auths);
  const json = typeof params.json === "string" ? params.json : JSON.stringify(params.json ?? {});
  const username = requiredPostingAuths[0] ?? requiredAuths[0];

  if (!username || typeof params.id !== "string") {
    return null;
  }

  const operation: Operation = [
    "custom_json",
    {
      id: params.id,
      json,
      required_auths: requiredAuths,
      required_posting_auths: requiredPostingAuths
    }
  ];

  const keyType = determineKeyType([operation], params.authority);

  return {
    username,
    keyType,
    operations: [operation]
  };
}

function buildWitnessVoteContext(params: Record<string, any>): HiveAuthContext | null {
  if (typeof params.account !== "string" || typeof params.witness !== "string") {
    return null;
  }

  const operation: Operation = [
    "account_witness_vote",
    {
      account: params.account,
      witness: params.witness,
      approve: toBoolean(params.approve)
    }
  ];

  return {
    username: params.account,
    keyType: "active",
    operations: [operation]
  };
}

function buildWitnessProxyContext(params: Record<string, any>): HiveAuthContext | null {
  if (typeof params.account !== "string" || typeof params.proxy !== "string") {
    return null;
  }

  const operation: Operation = [
    "account_witness_proxy",
    {
      account: params.account,
      proxy: params.proxy
    }
  ];

  return {
    username: params.account,
    keyType: "active",
    operations: [operation]
  };
}

function buildProposalVoteContext(params: Record<string, any>): HiveAuthContext | null {
  if (typeof params.account !== "string") {
    return null;
  }

  const proposalIdsRaw = params.proposal_ids;
  let proposalIds: number[] = [];
  if (Array.isArray(proposalIdsRaw)) {
    proposalIds = proposalIdsRaw.map((id) => Number(id));
  } else if (typeof proposalIdsRaw === "string") {
    try {
      const parsed = JSON.parse(proposalIdsRaw);
      if (Array.isArray(parsed)) {
        proposalIds = parsed.map((id) => Number(id));
      }
    } catch (err) {
      console.error("Failed to parse proposal ids", err);
    }
  }

  const operation: Operation = [
    "update_proposal_votes",
    {
      voter: params.account,
      proposal_ids: proposalIds,
      approve: toBoolean(params.approve),
      extensions: []
    }
  ];

  return {
    username: params.account,
    keyType: "active",
    operations: [operation]
  };
}

function buildGenericContext(
  endpoint: string,
  params: Record<string, any>
): HiveAuthContext | null {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    query.set(key, String(value));
  });

  const queryString = query.toString();
  const hiveUri = `hive://sign/${endpoint}${queryString ? `?${queryString}` : ""}`;

  try {
    const decoded = decodeHiveUri(hiveUri);
    const operations = (decoded.tx.operations ?? []) as Operation[];
    const keyType = determineKeyType(operations, decoded.params.authority);
    const username = extractSignerFromOperations(operations, params);

    if (!username) {
      return null;
    }

    return {
      username,
      keyType,
      operations
    };
  } catch (err) {
    console.error("Failed to decode hive URI for HiveAuth", err);
    return null;
  }
}

function createHiveAuthContext(
  endpoint: string,
  params: Record<string, any>
): HiveAuthContext | null {
  if (endpoint.startsWith("op/") || endpoint.startsWith("ops/") || endpoint.startsWith("tx/")) {
    return buildGenericContext(endpoint, params);
  }

  switch (endpoint) {
    case "custom-json":
      return buildCustomJsonContext(params);
    case "account-witness-vote":
      return buildWitnessVoteContext(params);
    case "account-witness-proxy":
      return buildWitnessProxyContext(params);
    case "update-proposal-votes":
      return buildProposalVoteContext(params);
    default:
      return null;
  }
}

export function hotSign(
  endpoint: string,
  params: {
    [key: string]: any;
  },
  redirect: string
) {
  if (shouldUseHiveAuth()) {
    const context = createHiveAuthContext(endpoint, params);

    if (context) {
      void broadcastWithHiveAuth(context.username, context.operations, context.keyType).catch((err) => {
        console.error("HiveAuth hot sign failed", err);
      });
      return;
    }
  }

  const webUrl = buildHotSignUrl(endpoint, params, redirect);
  const win = window.open(webUrl, "_blank");
  return win!.focus();
}
