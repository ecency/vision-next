"use client";

import { useQuery } from "@tanstack/react-query";
import { getSearchPathQueryOptions } from "@ecency/sdk";
import { useState } from "react";
import { useDebounce } from "react-use";

export function useSearchPathQuery(q: string) {
  const [requestQuery, setRequestQuery] = useState("");

  const query = useQuery(getSearchPathQueryOptions(requestQuery));

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
