import { getPostTipsQueryOptions, PostTip, PostTipsResponse } from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";

export type { PostTip, PostTipsResponse };

export const getPostTipsQuery = (author: string, permlink: string, isEnabled = true) => {
  const options = getPostTipsQueryOptions(author, permlink, isEnabled);

  return {
    ...options,
    useClientQuery: () => useQuery(options),
  };
};
