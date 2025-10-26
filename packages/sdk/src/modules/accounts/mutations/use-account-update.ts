import { useBroadcastMutation } from "@/modules/core";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAccountFullQueryOptions } from "../queries";
import { AccountProfile, FullAccount } from "../types";
import * as R from "remeda";

interface Payload {
  profile: Partial<AccountProfile>;
  tokens: AccountProfile["tokens"];
}

function sanitizeTokens(
  tokens?: AccountProfile["tokens"]
): AccountProfile["tokens"] | undefined {
  return tokens?.map(({ meta, ...rest }) => {
    if (!meta || typeof meta !== "object") {
      return { ...rest, meta };
    }

    const { privateKey, username, ...safeMeta } = meta;
    return { ...rest, meta: safeMeta };
  });
}

function getExistingProfile(data: FullAccount): AccountProfile {
  try {
    const parsed = JSON.parse(data?.posting_json_metadata || "{}");
    if (
      parsed &&
      typeof parsed === "object" &&
      parsed.profile &&
      typeof parsed.profile === "object"
    ) {
      return parsed.profile as AccountProfile;
    }
  } catch (e) {}

  return {} as AccountProfile;
}

function getBuiltProfile({
  profile,
  tokens,
  data,
}: Partial<Payload> & { data: FullAccount }) {
  const metadata = R.mergeDeep(getExistingProfile(data), profile ?? {});

  if (tokens && tokens.length > 0) {
    metadata.tokens = tokens;
  }

  metadata.tokens = sanitizeTokens(metadata.tokens);
  metadata.version = 2;

  return metadata;
}

export function useAccountUpdate(username: string) {
  const queryClient = useQueryClient();

  const { data } = useQuery(getAccountFullQueryOptions(username));

  return useBroadcastMutation(
    ["accounts", "update"],
    username,
    (payload: Partial<Payload>) => {
      if (!data) {
        throw new Error("[SDK][Accounts] – cannot update not existing account");
      }

      return [
        [
          "account_update2",
          {
            account: username,
            json_metadata: "",
            extensions: [],
            posting_json_metadata: JSON.stringify({
              profile: getBuiltProfile({ ...payload, data }),
            }),
          },
        ],
      ];
    },
    (_, variables) =>
      queryClient.setQueryData<FullAccount>(
        getAccountFullQueryOptions(username).queryKey,
        (data) => {
          if (!data) {
            return data;
          }

          const obj = R.clone(data);
          obj.profile = getBuiltProfile({ ...variables, data });
          return obj;
        }
      )
  );
}
