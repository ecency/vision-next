import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { Witness, WitnessVotersResponse } from "../types";
import { callREST } from "@/modules/core/hive-tx";
import { QueryKeys } from "@/modules/core";

type WitnessPage = Witness[];
type WitnessCursor = number;

interface HafbeWitness {
  witness_name: string;
  rank: number;
  url: string;
  vests: string;
  votes_daily_change: string;
  voters_num: number;
  voters_num_daily_change: number;
  price_feed: number;
  bias: number;
  feed_updated_at: string;
  block_size: number;
  signing_key: string;
  version: string;
  missed_blocks: number;
  hbd_interest_rate: number;
  last_confirmed_block_num: number;
  account_creation_fee: number;
}

interface HafbeWitnessesResponse {
  total_witnesses: number;
  total_pages: number;
  witnesses: HafbeWitness[];
}

/**
 * Map a hafbe-api witness to the SDK Witness shape so existing consumers
 * (e.g. the web app's transform()) keep working unchanged.
 */
function mapRestWitness(w: HafbeWitness): Witness {
  return {
    owner: w.witness_name,
    total_missed: w.missed_blocks,
    url: w.url,
    props: {
      account_creation_fee: `${(w.account_creation_fee / 1000).toFixed(3)} HIVE`,
      account_subsidy_budget: 0,
      maximum_block_size: w.block_size,
    },
    hbd_exchange_rate: {
      base: `${w.price_feed.toFixed(3)} HBD`,
    },
    available_witness_account_subsidies: 0,
    running_version: w.version,
    signing_key: w.signing_key,
    last_hbd_exchange_update: w.feed_updated_at,
    rank: w.rank,
    vests: w.vests,
    voters_num: w.voters_num,
    voters_num_daily_change: w.voters_num_daily_change,
    price_feed: w.price_feed,
    hbd_interest_rate: w.hbd_interest_rate,
    last_confirmed_block_num: w.last_confirmed_block_num,
  };
}

/**
 * Get witnesses ordered by vote count (infinite scroll).
 * Uses the hafbe-api REST endpoint - replaces multi-call RPC assembly
 * with a single paginated call. Includes voter count, rank, and other
 * data that was previously unavailable.
 *
 * @param limit - Number of witnesses per page
 */
export function getWitnessesInfiniteQueryOptions(limit: number) {
  return infiniteQueryOptions<WitnessPage, Error, WitnessPage, (string | number)[], WitnessCursor>({
    queryKey: QueryKeys.witnesses.list(limit),
    initialPageParam: 1 as WitnessCursor,

    queryFn: async ({ pageParam }: { pageParam: WitnessCursor }) => {
      const response = (await callREST(
        "hafbe",
        "/witnesses",
        {
          "page-size": limit,
          page: pageParam,
        }
      )) as HafbeWitnessesResponse;

      return response.witnesses.map(mapRestWitness);
    },

    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      lastPage.length === limit ? lastPageParam + 1 : undefined,
  });
}

export type WitnessVoterSortField =
  | "vests"
  | "account_vests"
  | "proxied_vests"
  | "account_name"
  | "timestamp";

export type WitnessVoterSortDirection = "asc" | "desc";

/**
 * Get a single page of voters for a specific witness.
 *
 * Server-side pagination + sort: each page click fetches that page directly
 * from hafbe rather than scrolling through accumulated pages on the client.
 *
 * @param witness - Witness account name
 * @param page - 1-based page index
 * @param pageSize - Number of voters per page
 * @param sort - Field to sort by
 * @param direction - asc or desc
 */
export function getWitnessVotersPageQueryOptions(
  witness: string,
  page: number,
  pageSize: number,
  sort: WitnessVoterSortField = "vests",
  direction: WitnessVoterSortDirection = "desc"
) {
  return queryOptions({
    queryKey: QueryKeys.witnesses.voters(witness, page, pageSize, sort, direction),
    queryFn: async () => {
      return (await callREST(
        "hafbe",
        "/witnesses/{witness-name}/voters",
        {
          "witness-name": witness,
          "page-size": pageSize,
          page,
          sort,
          direction,
        }
      )) as WitnessVotersResponse;
    },
    enabled: !!witness,
    staleTime: 60_000,
  });
}

/**
 * Get total voter count for a witness.
 *
 * @param witness - Witness account name
 */
export function getWitnessVoterCountQueryOptions(witness: string) {
  return queryOptions({
    queryKey: QueryKeys.witnesses.voterCount(witness),
    queryFn: async () => {
      return (await callREST(
        "hafbe",
        "/witnesses/{witness-name}/voters/count",
        { "witness-name": witness }
      )) as number;
    },
    enabled: !!witness,
    staleTime: 60_000,
  });
}
