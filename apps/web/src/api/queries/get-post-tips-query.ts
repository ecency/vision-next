import { appAxios } from "@/api/axios";
import { apiBase } from "@/api/helper";
import { EcencyQueriesManager, QueryIdentifiers } from "@/core/react-query";

export interface PostTip {
  sender: string;
  receiver: string;
  amount: number;
  currency: string;
  memo: string;
  source: string;
  timestamp: string;
}

export interface PostTipsResponse {
  meta: {
    count: number;
    totals: Record<string, number>;
  };
  list: PostTip[];
}

export const getPostTipsQuery = (author: string, permlink: string) =>
  EcencyQueriesManager.generateClientServerQuery({
    queryKey: [QueryIdentifiers.POST_TIPS, author, permlink],
    queryFn: async () => {
      const response = await appAxios.post<PostTipsResponse>(
        apiBase(`/private-api/post-tips`),
        {
          author,
          permlink
        }
      );

      return response.data;
    },
    enabled: !!author && !!permlink
  });
