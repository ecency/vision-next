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

/**
 * Parse the FULL root object of posting_json_metadata, not just its `profile`
 * key. Returns {} for missing/invalid input or a non-object root.
 *
 * `parseProfileMetadata` intentionally returns only `parsed.profile`; this
 * helper exists so writers can carry forward any sibling top-level keys that
 * live alongside `profile` (data other Hive apps may store there) instead of
 * dropping them on the next update.
 */
export function parsePostingMetadataRoot(
  postingJsonMetadata?: string | null
): Record<string, unknown> {
  if (!postingJsonMetadata) {
    return {};
  }

  try {
    const parsed = JSON.parse(postingJsonMetadata);
    if (isPlainObject(parsed)) {
      return parsed;
    }
  } catch (err) {
    console.warn("[SDK] Failed to parse posting_json_metadata root:", err, {
      length: postingJsonMetadata?.length ?? 0,
    });
  }

  return {};
}

/**
 * Build the serialized `posting_json_metadata` string for an account_update2
 * operation. It deep-merges the profile (via {@link buildProfileMetadata}) over
 * the account's CURRENT on-chain profile AND preserves any non-`profile`
 * top-level keys present in the existing metadata, so a partial profile update
 * (e.g. only `pinned` or only `tokens`) never clobbers unrelated fields.
 */
export function buildPostingJsonMetadata({
  existingPostingJsonMetadata,
  profile,
  tokens,
}: {
  existingPostingJsonMetadata?: string | null;
  profile?: Partial<AccountProfile> | null;
  tokens?: ProfileTokens | null;
}): string {
  const root = parsePostingMetadataRoot(existingPostingJsonMetadata);
  const existingProfile = isPlainObject(root.profile)
    ? (root.profile as AccountProfile)
    : ({} as AccountProfile);

  const mergedProfile = buildProfileMetadata({
    existingProfile,
    profile,
    tokens,
  });

  return JSON.stringify({ ...root, profile: mergedProfile });
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
