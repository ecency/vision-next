"use client";

import { Modal, ModalBody, ModalHeader, ModalTitle } from "@ui/modal";
import { Spinner } from "@ui/spinner";
import { FormControl } from "@ui/input";
import i18next from "i18next";
import { ProfileLink, UserAvatar } from "@/features/shared";
import { dateToFormatted, dateToFullRelative, formattedNumber } from "@/utils";
import { Tooltip } from "@ui/tooltip";
import { Pagination } from "@/features/ui";
import React, { useMemo, useState } from "react";
import {
  getWitnessVotersPageQueryOptions,
  getWitnessVoterCountQueryOptions,
  getDynamicPropsQueryOptions,
  vestsToHp,
} from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";

type SortOption = "vests" | "timestamp";

interface Props {
  witness: string;
  onHide: () => void;
}

const PAGE_SIZE = 12;

export function WitnessVotersDialog({ witness, onHide }: Props) {
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortOption>("vests");

  const { data: totalVoters } = useQuery(getWitnessVoterCountQueryOptions(witness));
  const { data: dynamicProps } = useQuery(getDynamicPropsQueryOptions());
  const hivePerMVests = dynamicProps?.hivePerMVests ?? 0;

  const { data, isLoading, isFetching } = useQuery(
    getWitnessVotersPageQueryOptions(witness, page, PAGE_SIZE, sort, "desc")
  );

  const voters = data?.voters ?? [];

  const visible = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return voters;
    return voters.filter((v) => v.voter_name.toLowerCase().includes(q));
  }, [voters, searchText]);

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
      {isLoading && !data ? (
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
            <div className="voters-list" aria-busy={isFetching}>
              <div className="list-body">
                {visible.length > 0
                  ? visible.map((voter) => (
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
                {totalVoters != null && totalVoters > PAGE_SIZE && (
                  <Pagination
                    dataLength={totalVoters}
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
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    setSort(e.target.value as SortOption);
                    setPage(1);
                  }}
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
          </ModalBody>
        </>
      )}
    </Modal>
  );
}
