"use client";

import { useQuery } from "@tanstack/react-query";
import { QueryIdentifiers } from "@/core/react-query";
import { appAxios } from "@/api/axios";
import { apiBase } from "@/api/helper";
import { useState } from "react";
import { useDebounce } from "react-use";

export function useSearchPathQuery(q: string) {
  const [requestQuery, setRequestQuery] = useState("");

  const query = useQuery({
    queryKey: [QueryIdentifiers.SEARCH_PATH, requestQuery],
    queryFn: async () => {
      const response = await appAxios.post(apiBase(`/search-api/search-path`), { q: requestQuery });
      if (response.data?.length > 0) {
        return response.data;
      }

      return [q];
    }
  });

  useDebounce(
    () => {
      if (requestQuery != q) {
        setRequestQuery(q);
      }
    },
    500,
    [q, requestQuery]
  );

  return query;
}
