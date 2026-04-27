"use client";

import { Modal, ModalBody, ModalHeader, ModalTitle } from "@ui/modal";
import { Spinner } from "@ui/spinner";
import { FormControl } from "@ui/input";
import i18next from "i18next";
import { ProfileLink, UserAvatar } from "@/features/shared";
import { dateToFormatted, dateToFullRelative, formattedNumber } from "@/utils";
import { Tooltip } from "@ui/tooltip";
import { Button, Pagination } from "@/features/ui";
import React, { useMemo, useState } from "react";
import {
  getWitnessVotersInfiniteQueryOptions,
  getWitnessVoterCountQueryOptions,
  getDynamicPropsQueryOptions,
  vestsToHp,
} from "@ecency/sdk";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

type SortOption = "vests" | "timestamp";

interface Props {
  witness: string;
  onHide: () => void;
}

const PAGE_SIZE = 12;

/**
 * Compare two stringified BigInt vests values safely.
 * Returns negative if a > b (for descending sort).
 */
function compareVests(aVests: string, bVests: string): number {
  try {
    const a = BigInt(aVests);
    const b = BigInt(bVests);
    if (b > a) return 1;
    if (b < a) return -1;
    return 0;
  } catch {
    return Number(bVests) - Number(aVests);
  }
}

export function WitnessVotersDialog({ witness, onHide }: Props) {
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortOption>("vests");

  const { data: totalVoters } = useQuery(getWitnessVoterCountQueryOptions(witness));
  const { data: dynamicProps } = useQuery(getDynamicPropsQueryOptions());
  const hivePerMVests = dynamicProps?.hivePerMVests ?? 0;

  const { data, isLoading, fetchNextPage, hasNextPage, isFetching } = useInfiniteQuery(
    getWitnessVotersInfiniteQueryOptions(witness, 50)
  );

  const allVoters = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flat();
  }, [data?.pages]);

  const filtered = useMemo(
    () =>
      allVoters.filter((v) =>
        v.voter_name.toLowerCase().includes(searchText.toLowerCase())
      ),
    [allVoters, searchText]
  );

  const sliced = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;

    return [...filtered]
      .sort((a, b) => {
        if (sort === "vests") {
          return compareVests(a.vests, b.vests);
        }
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      })
      .slice(start, end);
  }, [page, filtered, sort]);

  const title = i18next.t("witnesses.voters-title", { witness });

  return (
    <Modal
      onHide={() => {
        onHide();
        setSearchText("");
      }}
      show={true}
      centered={true}
      size="lg"
      className="entry-votes-modal px-3"
    >
      <ModalHeader closeButton={true} className="items-center">
        <ModalTitle>
          {title} {totalVoters != null && `(${totalVoters.toLocaleString(i18next.language || "en-US")})`}
        </ModalTitle>
      </ModalHeader>
      {isLoading && allVoters.length === 0 ? (
        <div className="flex justify-center py-8">
          <Spinner className="w-4 h-4" />
        </div>
      ) : (
        <>
          <div className="w-full px-3 mb-4">
            <FormControl
              type="text"
              placeholder={i18next.t("friends.search-placeholder")}
              value={searchText}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setSearchText(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <ModalBody>
            <div className="voters-list">
              <div className="list-body">
                {sliced.length > 0
                  ? sliced.map((voter) => (
                      <div className="list-item" key={voter.voter_name}>
                        <div className="item-main">
                          <ProfileLink username={voter.voter_name}>
                            <UserAvatar username={voter.voter_name} size="small" />
                          </ProfileLink>
                          <div className="item-info">
                            <ProfileLink username={voter.voter_name}>
                              <span className="item-name notranslate">
                                {voter.voter_name}
                              </span>
                            </ProfileLink>
                          </div>
                        </div>
                        <div className="item-extra">
                          <span>
                            {formattedNumber(
                              vestsToHp(Number(voter.vests) / 1e6, hivePerMVests),
                              { fractionDigits: 0, suffix: " HP" }
                            )}
                          </span>
                          <span className="separator" />
                          <Tooltip content={dateToFormatted(voter.timestamp)}>
                            <span>{dateToFullRelative(voter.timestamp)}</span>
                          </Tooltip>
                        </div>
                      </div>
                    ))
                  : i18next.t("communities.no-results")}
              </div>
            </div>
            <div className="list-tools">
              <div className="pages">
                {filtered.length > PAGE_SIZE && (
                  <Pagination
                    dataLength={filtered.length}
                    pageSize={PAGE_SIZE}
                    maxItems={4}
                    page={page}
                    onPageChange={(p) => setPage(p)}
                  />
                )}
              </div>
              <div className="sorter">
                <span className="label">{i18next.t("entry-votes.sort")}</span>
                <FormControl
                  type="select"
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setSort(e.target.value as SortOption)
                  }
                  value={sort}
                >
                  <option value="vests">
                    {i18next.t("witnesses.voters-sort-vests")}
                  </option>
                  <option value="timestamp">
                    {i18next.t("witnesses.voters-sort-timestamp")}
                  </option>
                </FormControl>
              </div>
            </div>
            {hasNextPage && (
              <div className="flex justify-center mt-4">
                <Button
                  onClick={() => fetchNextPage()}
                  disabled={isFetching}
                >
                  {isFetching
                    ? i18next.t("g.loading")
                    : i18next.t("g.load-more")}
                </Button>
              </div>
            )}
          </ModalBody>
        </>
      )}
    </Modal>
  );
}
