import { AccountProfile, FullAccount } from "../types";

export type ProfileTokens = AccountProfile["tokens"];

const DENIED_KEYS = new Set(["__proto__", "constructor", "prototype"]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === null || proto === Object.prototype;
}

function deepMerge<T extends Record<string, unknown>>(target: T, source: Record<string, unknown>): T {
  const result = { ...target } as Record<string, unknown>;
  for (const key of Object.keys(source)) {
    if (DENIED_KEYS.has(key)) {
      continue;
    }
    const srcVal = source[key];
    const tgtVal = result[key];
    if (isPlainObject(srcVal) && isPlainObject(tgtVal)) {
      result[key] = deepMerge(tgtVal, srcVal);
    } else {
      result[key] = srcVal;
    }
  }
  return result as T;
}

export interface BuildProfileMetadataArgs {
  existingProfile?: AccountProfile;
  profile?: Partial<AccountProfile> | null;
  tokens?: ProfileTokens | null;
}

function sanitizeTokens(
  tokens?: ProfileTokens | null
): ProfileTokens | undefined {
  // Guard against corrupted data from blockchain where tokens is not an array
  if (!tokens || !Array.isArray(tokens)) {
    return undefined;
  }

  return tokens.map(({ meta, ...rest }) => {
    if (!meta || typeof meta !== "object") {
      return { ...rest, meta };
    }

    const { privateKey, username, ...safeMeta } = meta;
    return { ...rest, meta: safeMeta };
  });
}

export function parseProfileMetadata(
  postingJsonMetadata?: string | null
): AccountProfile {
  if (!postingJsonMetadata) {
    return {} as AccountProfile;
  }

  try {
    const parsed = JSON.parse(postingJsonMetadata);
    if (
      parsed &&
      typeof parsed === "object" &&
      parsed.profile &&
      typeof parsed.profile === "object"
    ) {
      return parsed.profile as AccountProfile;
    }
  } catch (err) {
    console.warn("[SDK] Failed to parse posting_json_metadata:", err, { length: postingJsonMetadata?.length ?? 0 });
  }

  return {} as AccountProfile;
}

export function extractAccountProfile(
  data?: Pick<FullAccount, "posting_json_metadata"> | null
): AccountProfile {
  return parseProfileMetadata(data?.posting_json_metadata);
}

export function buildProfileMetadata({
  existingProfile,
  profile,
  tokens,
}: BuildProfileMetadataArgs): AccountProfile {
  const { tokens: profileTokens, version: _ignoredVersion, ...profileRest } =
    profile ?? {};

  const metadata = deepMerge(
    (existingProfile ?? {}) as Record<string, unknown>,
    profileRest as Record<string, unknown>,
  ) as AccountProfile;

  // Clean up corrupted tokens data from blockchain before processing
  if (metadata.tokens && !Array.isArray(metadata.tokens)) {
    metadata.tokens = undefined;
  }

  // tokens semantics:
  //   undefined → no change, fall back to profileTokens from profile partial
  //   null or [] → explicitly clear tokens
  //   non-empty array → set tokens
  if (tokens !== undefined) {
    // Explicit intent from caller: null or [] clears, non-empty array sets
    metadata.tokens = tokens && tokens.length > 0 ? tokens : [];
  } else if (profileTokens !== undefined) {
    // Fall back to tokens from profile partial (including empty array to clear)
    metadata.tokens = profileTokens;
  }

  metadata.tokens = sanitizeTokens(metadata.tokens);
  metadata.version = 2;

  return metadata;
}
