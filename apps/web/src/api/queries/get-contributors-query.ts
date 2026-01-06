import { QueryIdentifiers } from "@/core/react-query";
import { shuffle } from "remeda";
import contributors from "@/consts/contributors.json";

export const getContributorsQueryOptions = () => ({
  queryKey: [QueryIdentifiers.CONTRIBUTORS],
  queryFn: () => shuffle(contributors)
});
