"use client";

import { Table, Td, Th, Tr } from "@ui/table";
import i18next from "i18next";
import { EntryLink, LinearProgress, ProfileLink, UserAvatar } from "@/features/shared";
import { linkSvg, openInNewSvg } from "@ui/svg";
import { dateToRelative } from "@/utils";
import React, { useEffect, useMemo, useState } from "react";
import { WitnessVoteBtn } from "@/app/witnesses/_components/witness-vote-btn";
import { WitnessCard } from "@/app/witnesses/_components/witness-card";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { getWitnessesInfiniteQueryOptions, getAccountsQueryOptions } from "@ecency/sdk";
import { convertToOriginalWitnesses, makeUnique, transform } from "@/app/witnesses/_utils";
import { FormControl } from "@ui/input";
import { usePrevious } from "react-use";
import { useProxyVotesQuery, useWitnessProxyQuery } from "@/app/witnesses/_queries";
import { useQueryClient } from "@tanstack/react-query";
import { QueryIdentifiers } from "@/core/react-query";
import { WitnessesControls } from "@/app/witnesses/_components/witnesses-controls";
import WitnessesActiveProxy from "./witnesses-active-proxy";
import { useSearchParams } from "next/navigation";

type SortOption = "rank" | "name" | "fee";

export function WitnessesList() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();

  const [limit, setLimit] = useState(50);
  const [rank, setRank] = useState(1);
  const [searchText, setSearchText] = useState("");
  const [sort, setSort] = useState<SortOption>("rank");
  const [page, setPage] = useState(1);
  const previousPage = usePrevious(page);

  const { data, isPending, fetchNextPage } = useInfiniteQuery(getWitnessesInfiniteQueryOptions(limit));
  const { data: proxyVotes } = useProxyVotesQuery();
  const { data: proxyInfo } = useWitnessProxyQuery();

  const currentPageData = useMemo(() => data?.pages[page - 1] ?? [], [data, page]);
  const transformedWitnesses = useMemo(
    () => transform(currentPageData, rank),
    [currentPageData, rank]
  );
  const witnessesUserNames = useMemo(
    () => transformedWitnesses.map((item) => item.name),
    [transformedWitnesses]
  );

  const { data: witnessesUserAccounts } = useQuery(getAccountsQueryOptions(witnessesUserNames));

  const originalWitnesses = useMemo(
    () => makeUnique(convertToOriginalWitnesses(transformedWitnesses, witnessesUserAccounts)),
    [transformedWitnesses, witnessesUserAccounts]
  );
  const witnesses = useMemo(
    () =>
      originalWitnesses
        .filter((item) => item.name.toLocaleLowerCase().includes(searchText.toLocaleLowerCase()))
        .sort((a, b) => {
          const keyA = a[sort]!;
          const keyB = b[sort]!;

          if (keyA < keyB) return -1;
          if (keyA > keyB) return 1;
          return 0;
        }),
    [originalWitnesses, searchText, sort]
  );

  useEffect(() => {
    if (previousPage && page > previousPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, page, previousPage]);

  const usernameParam = searchParams?.get("username");
  const accountParam = searchParams?.get("account");
  const highlightedProxy = proxyInfo?.highlightedProxy ?? "";
  const activeUserProxy = proxyInfo?.activeUserProxy ?? "";
  const highlightedUsername = usernameParam ?? accountParam ?? highlightedProxy ?? "";
  const shouldShowHighlightBanner = Boolean(highlightedUsername);
  const isActiveUserProxy = Boolean(!usernameParam && !accountParam && activeUserProxy);

  return isPending ? (
    <LinearProgress />
  ) : (
    <>
      {shouldShowHighlightBanner && highlightedUsername && (
        <WitnessesActiveProxy
          isProxy={isActiveUserProxy}
          username={highlightedUsername}
          onDone={() =>
            queryClient.invalidateQueries({ queryKey: [QueryIdentifiers.WITNESSES, "proxy"] })
          }
        />
      )}
      <div className="mb-3 w-full">
        <div className="search-bar">
          <FormControl
            type="text"
            placeholder={i18next.t("witnesses.search-placeholder")}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
      </div>
      <div className="witnesses-table">
        <Table full={true}>
          <thead>
            <Tr>
              <Th className="border p-2 col-rank">{i18next.t("witnesses.list-rank")}</Th>
              <Th className="border p-2 ">{i18next.t("witnesses.list-witness")}</Th>
              <Th className="border p-2 col-miss">{i18next.t("witnesses.list-miss")}</Th>
              <Th className="border p-2 col-url">{i18next.t("witnesses.list-url")}</Th>
              <Th className="border p-2 col-fee">{i18next.t("witnesses.list-fee")}</Th>
              <Th className="border p-2 col-feed">{i18next.t("witnesses.list-feed")}</Th>
              <Th className="border p-2 col-version">{i18next.t("witnesses.list-version")}</Th>
            </Tr>
          </thead>
          <tbody>
            {witnesses.map((row, i) => (
              <Tr
                key={`${row.name}-${row.rank}${i}`}
                className={`${proxyVotes.includes(row.name) ? "voted-by-voter" : ""}`}
              >
                <Td className="border p-2">
                  <div className="witness-rank">
                    <span className="rank-number">{row.rank}</span>
                    <WitnessVoteBtn witness={row.name} />
                  </div>
                </Td>
                <Td className="border p-2">
                  <ProfileLink username={row.name}>
                    <span className="witness-card notranslate">
                      {" "}
                      <UserAvatar username={row.name} size="medium" />
                      <div className={"witness-ctn"}>
                        {row.signingKey === "STM1111111111111111111111111111111114T1Anm" ? (
                          <s>{row.name}</s>
                        ) : (
                          row.name
                        )}
                        {row.witnessBy && (
                          <div className={"notranslate"}>
                            <small>by {row.witnessBy}</small>
                          </div>
                        )}
                      </div>
                    </span>
                  </ProfileLink>
                </Td>
                <Td className="border p-2">
                  <span className="witness-miss">{row.miss}</span>
                </Td>
                <Td className="border p-2">
                  {row.parsedUrl ? (
                    <EntryLink entry={row.parsedUrl}>
                      <span className="witness-link">{linkSvg}</span>
                    </EntryLink>
                  ) : (
                    <a target="_external" rel="nofollow ugc noopener" href={row.url} className="witness-link">
                      {openInNewSvg}
                    </a>
                  )}
                </Td>
                <Td className="border p-2">
                  <span className="witness-fee">{row.fee}</span>
                </Td>
                <Td className="border p-2">
                  <div className="witness-feed">
                    <span className="inner">
                      ${row.feed.replace(" HBD", "")} | {dateToRelative(row.priceAge)}
                    </span>
                  </div>
                </Td>
                <Td className="border p-2">
                  <div className="witness-version">
                    <span className="inner">{row.version}</span>
                  </div>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </div>
      <div className="md:hidden">
        {witnesses.map((row, i) => (
          <div key={`${row.name}${i}`}>
            <div className={`${proxyVotes.includes(row.name) ? "voted-by-voter" : ""}`}>
              <WitnessCard witness={row.name} row={row} key={`${row.name}-${i}`} />
            </div>
          </div>
        ))}
      </div>
      <div className="table-tools">
        {/*<Pagination*/}
        {/*  dataLength={witnesses.length}*/}
        {/*  pageSize={limit}*/}
        {/*  maxItems={4}*/}
        {/*  page={page}*/}
        {/*  onPageChange={(page) => setPage(page)}*/}
        {/*/>*/}

        <div className="sorter">
          <span className="label">{i18next.t("witnesses.sort")}</span>
          <FormControl type="select" onChange={(e: any) => setSort(e.target.value)} value={sort}>
            <option value="rank">{i18next.t("witnesses.sort-rank")}</option>
            <option value="name">{i18next.t("witnesses.sort-name")}</option>
            <option value="fee">{i18next.t("witnesses.sort-fee")}</option>
          </FormControl>
        </div>
      </div>
      <WitnessesControls witnesses={witnesses} />
    </>
  );
}
