import * as R from "remeda";

import { AccountProfile, FullAccount } from "../types";

export type ProfileTokens = AccountProfile["tokens"];

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
  } catch (err) {}

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

  const metadata = R.mergeDeep(
    existingProfile ?? ({} as AccountProfile),
    profileRest
  );

  // Clean up corrupted tokens data from blockchain before processing
  if (metadata.tokens && !Array.isArray(metadata.tokens)) {
    metadata.tokens = undefined;
  }

  const nextTokens = tokens ?? profileTokens;

  if (nextTokens && nextTokens.length > 0) {
    metadata.tokens = nextTokens;
  }

  metadata.tokens = sanitizeTokens(metadata.tokens);
  metadata.version = 2;

  return metadata;
}
