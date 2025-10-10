import { EcencyQueriesManager, QueryIdentifiers } from "@/core/react-query";
import { appAxios } from "@/api/axios";
import { apiBase } from "@/api/helper";
import { WaveTrendingTag } from "@/entities";

interface WavesTrendingTagResponse {
  tag: string;
  posts: number;
}

export const getWavesTrendingTagsQuery = (host: string, hours = 24) =>
  EcencyQueriesManager.generateClientServerQuery<WaveTrendingTag[]>({
    queryKey: [QueryIdentifiers.WAVES_TRENDING_TAGS, host, hours],
    queryFn: async () => {
      try {
        const { data } = await appAxios.get<WavesTrendingTagResponse[]>(
          apiBase("/private-api/waves/trending/tags"),
          {
            params: {
              container: host,
              hours
            }
          }
        );

        return data.map(({ tag, posts }) => ({ tag, posts }));
      } catch (error) {
        console.error("Failed to fetch waves trending tags", error);
        return [];
      }
    }
  });
