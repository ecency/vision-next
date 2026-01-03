"use client";

import React, { useMemo, useState } from "react";
import numeral from "numeral";
import "./_index.scss";
import { Modal, ModalBody, ModalHeader, ModalTitle } from "@ui/modal";
import { FormControl } from "@ui/input";
import { List, ListItem } from "@ui/list";
import { Badge } from "@ui/badge";
import i18next from "i18next";
import { Entry, Proposal } from "@/entities";
import { LinearProgress, ProfileLink, ProfilePopover, UserAvatar } from "@/features/shared";
import { accountReputation, parseAsset } from "@/utils";
import { DEFAULT_DYNAMIC_PROPS, getDynamicPropsQuery, getProposalVotesQuery } from "@/api/queries";
import { Spinner } from "@ui/spinner";
import { Pagination } from "@/features/ui";

type SortOption = "reputation" | "hp";

interface ProposalVotesProps {
  proposal: Proposal;
  onHide: () => void;
}

export function ProposalVotes({ proposal, onHide }: ProposalVotesProps) {
  const [searchText, setSearchText] = useState("");
  const [sort, setSort] = useState<SortOption>("hp");
  const [page, setPage] = useState(1);

  const { data: dynamicProps } = getDynamicPropsQuery().useClientQuery();
  const {
    data: votesPages,
    isFetching,
    fetchNextPage,
    error,
    isError
  } = getProposalVotesQuery(proposal.proposal_id, "", 1000).useClientQuery();
  const votes = useMemo(
    () => votesPages?.pages?.reduce((acc, page) => [...acc, ...page], []),
    [votesPages?.pages]
  );

  const voters = useMemo(
    () =>
      votes
        ?.map(({ voterAccount: account }) => {
          const hp =
            (parseAsset(account.vesting_shares).amount *
              (dynamicProps ?? DEFAULT_DYNAMIC_PROPS).hivePerMVests) /
            1e6;

          let vsfVotes = 0;
          account.proxied_vsf_votes.forEach((x: string | number) => (vsfVotes += Number(x)));

          const proxyHp = (vsfVotes * (dynamicProps ?? DEFAULT_DYNAMIC_PROPS).hivePerMVests) / 1e12;
          const totalHp = hp + proxyHp;

          return {
            name: account.name,
            reputation: account.reputation!,
            hp,
            proxyHp,
            totalHp
          };
        })
        .filter(
          (item) => !searchText || item.name.toLowerCase().includes(searchText.toLocaleLowerCase())
        )
        .sort((a, b) => {
          if (sort === "reputation") {
            return b.reputation > a.reputation ? 1 : -1;
          }
          return b.totalHp > a.totalHp ? 1 : -1;
        }),
    [votes, dynamicProps, searchText, sort]
  );

  const paginatedVoters = useMemo(() => voters?.slice((page - 1) * 10, page * 10), [page, voters]);

  return (
    <Modal onHide={onHide} show={true} centered={true} size="lg" className="proposal-votes-dialog">
      <ModalHeader closeButton={true} className="items-center">
        <ModalTitle>
          <span className="text-blue-dark-sky mr-2">
            {isFetching ? (
              <Spinner className="inline-flex w-3.5 h-3.5" />
            ) : voters && voters.length >= 1000 ? (
              "1000+"
            ) : (
              voters?.length
            )}
          </span>
          <span>{i18next.t("proposals.votes-dialog-title", { n: proposal.id })}</span>
        </ModalTitle>
      </ModalHeader>
      <div className="w-full flex flex-col sm:flex-row gap-4 p-3 mb-3">
        <FormControl
          type="text"
          placeholder={i18next.t("proposals.search-placeholder")}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
        <FormControl
          type="select"
          onChange={(e: any) => setSort(e.target.value as SortOption)}
          value={sort}
        >
          <option value="reputation">{i18next.t("proposals.sort-reputation")}</option>
          <option value="hp">{i18next.t("proposals.sort-hp")}</option>
        </FormControl>
      </div>
      <ModalBody>
        {isFetching && <LinearProgress />}

        {isError && (
          <div className="p-4 mb-4 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg">
            <p className="text-red-800 dark:text-red-200 font-semibold mb-2">
              {i18next.t("g.server-error")}
            </p>
            <p className="text-red-700 dark:text-red-300 text-sm">
              Failed to load proposal votes. This might be due to browser privacy settings blocking API requests.
              {error instanceof Error && (
                <>
                  <br />
                  <span className="text-xs opacity-75">Error: {error.message}</span>
                </>
              )}
            </p>
            <p className="text-red-700 dark:text-red-300 text-sm mt-2">
              Try: Opening browser console (F12), checking for blocked requests, or trying a different browser.
            </p>
          </div>
        )}

        <div className="voters-list mb-4">
          <List grid={true} inline={true} defer={true}>
            {(voters?.length ?? 0) > 0 ? (
              paginatedVoters?.map((x, index) => {
                const strHp = numeral(x.hp).format("0.00,");
                const strProxyHp = numeral(x.proxyHp).format("0.00,");

                return (
                  <ListItem styledDefer={true} key={index} className="!flex gap-3">
                    <ProfileLink username={x.name}>
                      <UserAvatar username={x.name} size="small" />
                    </ProfileLink>
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <ProfilePopover entry={{ author: x.name } as Entry} />
                        {+x.reputation > 0 && (
                          <Badge className="text-xs leading-3">
                            {accountReputation(x.reputation)}
                          </Badge>
                        )}
                      </div>
                      <div className="item-extra">
                        <span>{`${strHp} HP`}</span>
                        {x.proxyHp > 0 && (
                          <>
                            {" + "}
                            <span>
                              {`${strProxyHp} HP`}
                              {" (proxy) "}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </ListItem>
                );
              })
            ) : (
              <div className="user-info">
                {isFetching ? i18next.t("proposals.searching") : i18next.t("proposals.no-results")}
              </div>
            )}
          </List>
          {voters && voters.length > 10 && (
            <div className="mt-4">
              <Pagination
                dataLength={voters?.length ?? 0}
                pageSize={10}
                onPageChange={(p) => {
                  setPage(p);
                  if (voters?.length / 10 === p) {
                    fetchNextPage();
                  }
                }}
                page={page}
              />
            </div>
          )}
        </div>
      </ModalBody>
    </Modal>
  );
}
