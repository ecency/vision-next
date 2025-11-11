import hs from "hivesigner";
import { decode as decodeHiveUri } from "hive-uri";

import { b64uEnc } from "./b64";
import { getAccessToken } from "./user-token";
import { HiveSignerMessage } from "@/types";
import {
  broadcastWithHiveAuth,
  shouldUseHiveAuth,
  type HiveAuthChallengeResult
} from "./hive-auth";
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
  signer: (message: string) => Promise<string | HiveAuthChallengeResult>
): Promise<string> {
  const timestamp = Math.floor(Date.now() / 1000);

  const messageObj: HiveSignerMessage = {
    signed_message: { type: "code", app: hsClientId },
    authors: [account],
    timestamp
  };

  const message = JSON.stringify(messageObj);

  const signedResult = await signer(message);
  const signature =
    typeof signedResult === "string" ? signedResult : signedResult.signature;

  messageObj.signatures = [signature];
  const encoded = b64uEnc(JSON.stringify(messageObj));

  if (
    signedResult &&
    typeof signedResult === "object" &&
    typeof signedResult.signedToken === "string" &&
    signedResult.signedToken
  ) {
    return signedResult.signedToken;
  }

  return encoded;
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

function toNumber(value: any): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function parseJsonValue<T>(value: any): T | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "object") {
    return value as T;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed as T;
    } catch (err) {
      return null;
    }
  }

  return null;
}

function ensureString(value: any, fallback = ""): string {
  if (typeof value === "string") {
    return value;
  }

  if (value === undefined || value === null) {
    return fallback;
  }

  try {
    return JSON.stringify(value);
  } catch (err) {
    console.error("Failed to serialize HiveAuth string value", err);
    return fallback;
  }
}

function buildVoteContext(params: Record<string, any>): HiveAuthContext | null {
  const voter = typeof params.voter === "string" ? params.voter : params.account;
  const author = typeof params.author === "string" ? params.author : null;
  const permlink = typeof params.permlink === "string" ? params.permlink : null;
  const weightValue =
    params.weight ?? params.voting_weight ?? params.vote_weight ?? params.weight_pct;
  const weight = toNumber(weightValue);

  if (!voter || !author || !permlink || weight === null) {
    return null;
  }

  const operation: Operation = [
    "vote",
    {
      voter,
      author,
      permlink,
      weight: Math.trunc(weight)
    }
  ];

  return { username: voter, keyType: "posting", operations: [operation] };
}

function buildCommentContext(params: Record<string, any>): HiveAuthContext | null {
  const author = typeof params.author === "string" ? params.author : params.account;
  const permlink = typeof params.permlink === "string" ? params.permlink : null;
  const parentPermlink =
    typeof params.parent_permlink === "string" ? params.parent_permlink : null;

  if (!author || !permlink || parentPermlink === null) {
    return null;
  }

  const operation: Operation = [
    "comment",
    {
      parent_author: typeof params.parent_author === "string" ? params.parent_author : "",
      parent_permlink: parentPermlink,
      author,
      permlink,
      title: ensureString(params.title),
      body: ensureString(params.body),
      json_metadata: ensureString(params.json_metadata, "{}")
    }
  ];

  return { username: author, keyType: "posting", operations: [operation] };
}

function parseBeneficiaries(value: any): { account: string; weight: number }[] {
  const parsed = parseJsonValue<{ account: string; weight: number }[]>(value);
  if (Array.isArray(parsed)) {
    return parsed.filter(
      (entry) => typeof entry?.account === "string" && toNumber(entry?.weight) !== null
    );
  }
  return [];
}

function buildCommentOptionsContext(params: Record<string, any>): HiveAuthContext | null {
  const author = typeof params.author === "string" ? params.author : null;
  const permlink = typeof params.permlink === "string" ? params.permlink : null;

  if (!author || !permlink) {
    return null;
  }

  const percentRaw =
    params.percent_hbd ?? params.percent_hive_dollars ?? params.percent_steem_dollars;
  const percent = toNumber(percentRaw) ?? 10000;
  const allowVotes = params.allow_votes !== undefined ? toBoolean(params.allow_votes) : true;
  const allowCuration =
    params.allow_curation_rewards !== undefined
      ? toBoolean(params.allow_curation_rewards)
      : true;

  let extensions = parseJsonValue<any[]>(params.extensions) ?? [];
  if (!extensions.length) {
    const beneficiaries = parseBeneficiaries(params.beneficiaries);
    if (beneficiaries.length) {
      extensions = [[0, { beneficiaries }]];
    }
  }

  const operation: Operation = [
    "comment_options",
    {
      author,
      permlink,
      max_accepted_payout: ensureString(params.max_accepted_payout, "1000000.000 HBD"),
      percent_steem_dollars: Math.trunc(percent),
      allow_votes: allowVotes,
      allow_curation_rewards: allowCuration,
      extensions
    }
  ];

  return { username: author, keyType: "posting", operations: [operation] };
}

function buildDeleteCommentContext(params: Record<string, any>): HiveAuthContext | null {
  const author = typeof params.author === "string" ? params.author : null;
  const permlink = typeof params.permlink === "string" ? params.permlink : null;

  if (!author || !permlink) {
    return null;
  }

  const operation: Operation = [
    "delete_comment",
    {
      author,
      permlink
    }
  ];

  return { username: author, keyType: "posting", operations: [operation] };
}

function buildClaimRewardBalanceContext(params: Record<string, any>): HiveAuthContext | null {
  const account = typeof params.account === "string" ? params.account : null;

  if (!account) {
    return null;
  }

  const operation: Operation = [
    "claim_reward_balance",
    {
      account,
      reward_hbd: ensureString(params.reward_hbd, "0.000 HBD"),
      reward_hive: ensureString(params.reward_hive, "0.000 HIVE"),
      reward_vests: ensureString(params.reward_vests, "0.000000 VESTS")
    }
  ];

  return { username: account, keyType: "posting", operations: [operation] };
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
    case "vote":
      return buildVoteContext(params);
    case "comment":
      return buildCommentContext(params);
    case "comment-options":
      return buildCommentOptionsContext(params);
    case "delete-comment":
      return buildDeleteCommentContext(params);
    case "claim-reward-balance":
      return buildClaimRewardBalanceContext(params);
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
  const context = createHiveAuthContext(endpoint, params);

  if (context && shouldUseHiveAuth(context.username)) {
    void broadcastWithHiveAuth(context.username, context.operations, context.keyType).catch((err) => {
      console.error("HiveAuth hot sign failed", err);
    });
    return;
  }

  const webUrl = buildHotSignUrl(endpoint, params, redirect);
  const win = window.open(webUrl, "_blank");
  return win!.focus();
}
