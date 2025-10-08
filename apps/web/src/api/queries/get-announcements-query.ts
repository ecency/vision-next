import { EcencyQueriesManager, QueryIdentifiers } from "@/core/react-query";
import { appAxios } from "@/api/axios";
import { Announcement } from "@/entities";
import { apiBase } from "@/api/helper";

export const getAnnouncementsQuery = () =>
  EcencyQueriesManager.generateClientServerQuery({
    queryKey: [QueryIdentifiers.ANNOUNCEMENTS],
    queryFn: async () => {
      const res = await appAxios.get<Announcement[]>(apiBase(`/private-api/announcements`));
      if (!res.data) {
        return [];
      }

      return res.data;
    },
    staleTime: 3_600_000
  });
