"use client";

import React, { useMemo, useState } from "react";
import moment, { now } from "moment";
import numeral from "numeral";
import "./_index.scss";
import { Proposal } from "@/entities";
import { EntryLink, ProfileLink, Skeleton, UserAvatar } from "@/features/shared";
import i18next from "i18next";
import { linkSvg } from "@ui/svg";
import Link from "next/link";
import { parseAsset } from "@/utils";
import { ProposalVoteBtn, ProposalVotes } from "@/app/proposals/_components";
import { DEFAULT_DYNAMIC_PROPS, getDynamicPropsQuery, getProposalVotesQuery } from "@/api/queries";
import { useSearchParams } from "next/navigation";
import { Badge } from "@ui/badge";

interface Props {
  proposal: Proposal;
  isReturnProposalId?: number;
  thresholdProposalId?: number | null;
}

export function ProposalListItem({ proposal, isReturnProposalId, thresholdProposalId }: Props) {
  const params = useSearchParams();
  const [show, setShow] = useState(false);

  const { data: votesPages, isLoading } = getProposalVotesQuery(
    proposal.proposal_id,
    params?.get("voter") ?? "",
    1000
  ).useClientQuery();
  const { data: dynamicProps } = getDynamicPropsQuery().useClientQuery();
  const votes = useMemo(() => votesPages?.pages?.reduce((acc, page) => [...acc, ...page], []), []);

  const votedByVoter = useMemo(
    () => (votes?.length ?? 0) > 0 && votes?.[0].voter === params?.get("voter"),
    [params, votes]
  );

  const startDate = moment(new Date(proposal.start_date));
  const endDate = moment(new Date(proposal.end_date));
  const duration = endDate.diff(startDate, "days");

  const votesHP =
    (Number(proposal.total_votes) / 1e12) * (dynamicProps ?? DEFAULT_DYNAMIC_PROPS).hivePerMVests;
  const strVotes = numeral(votesHP).format("0.00,") + " HP";

  const dailyPayment = parseAsset(proposal.daily_pay);
  const strDailyHdb = numeral(dailyPayment.amount).format("0.0a");

  const allPayment = dailyPayment.amount * duration;
  const strAllPayment = numeral(allPayment).format("0.0a");
  const diff = endDate.diff(moment(now()), "days");
  const remaining = diff < 0 ? 0 : diff;

  return isLoading ? (
    <Skeleton className="w-full loadingSearch mb-3 shadow" />
  ) : (
    <div className={`proposal-list-item ${votedByVoter ? "voted-by-voter" : ""}`}>
      <div className="item-content">
        <div className="left-side">
          <div className="proposal-users-card">
            <div className="flex items-center gap-2">
              {i18next.t("proposals.by")}{" "}
              <ProfileLink username={proposal.creator}>
                <Badge className="!p-1 gap-1 !pr-1.5">
                  <UserAvatar username={proposal.creator} size="small" />
                  <span> {proposal.creator}</span>
                </Badge>
              </ProfileLink>
              {proposal.receiver && proposal.receiver !== proposal.creator && (
                <>
                  {i18next.t("proposals.for")}{" "}
                  <ProfileLink username={proposal.receiver}>
                    <Badge className="!p-1 gap-1 !pr-1.5">
                      <UserAvatar username={proposal.receiver} size="small" />
                      <span> {proposal.receiver}</span>
                    </Badge>
                  </ProfileLink>
                </>
              )}
            </div>
          </div>
          <div className="proposal-title">
            <Link href={`/proposals/${proposal.id}`}>
              {proposal.subject} <span className="proposal-id">#{proposal.id}</span>
            </Link>
          </div>
          <div className="status-duration-payment">
            <div className={`proposal-status ${proposal.status}`}>
              {i18next.t(`proposals.status-${proposal.status}`)}
            </div>
            <div className="proposal-duration">
              {startDate.format("ll")} {"-"} {endDate.format("ll")} (
              {i18next.t("proposals.duration-days", { n: duration })})
            </div>
            <div className="proposal-payment">
              <span className="all-pay">{`${strAllPayment} HBD`}</span>
              <span className="daily-pay">
                ({i18next.t("proposals.daily-pay", { n: strDailyHdb })} {"HBD"})
              </span>
            </div>
          </div>
          <div className="permlink">
            <EntryLink
              entry={{
                category: "proposal",
                author: proposal.creator,
                permlink: proposal.permlink
              }}
            >
              <span>
                {linkSvg} {"/"}
                {proposal.creator}
                {"/"}
                {proposal.permlink}
              </span>
            </EntryLink>
          </div>
          <div className="votes">
            <a
              href="#"
              className="btn-votes"
              onClick={(e) => {
                e.preventDefault();
                setShow(true);
              }}
            >
              {i18next.t("proposals.votes", { n: strVotes })}
            </a>
          </div>
        </div>
        <div className="right-side">
          <div className="voting">
            <ProposalVoteBtn proposal={proposal.id} />
          </div>
          <div className="remaining-days">
            {i18next.t("proposals.remaining-days", { n: remaining })}
          </div>
        </div>
      </div>
      {proposal.id !== isReturnProposalId && thresholdProposalId === proposal.id && (
        <div className="return-proposal">{i18next.t("proposals.threshold-description")}</div>
      )}
      {proposal.id === isReturnProposalId && (
        <div className="return-proposal">{i18next.t("proposals.return-description")}</div>
      )}
      {show && <ProposalVotes proposal={proposal} onHide={() => setShow(false)} />}
    </div>
  );
}
