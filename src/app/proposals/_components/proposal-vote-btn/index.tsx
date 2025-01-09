import React, { useMemo } from "react";
import "./_index.scss";
import { useGlobalStore } from "@/core/global-store";
import { KeyOrHotDialog, LoginRequired } from "@/features/shared";
import { useProposalVoteByKey, useProposalVoteByKeychain } from "@/api/mutations/proposal-vote";
import { proposalVoteHot } from "@/api/operations";
import { getProposalVotesQuery } from "@/api/queries";
import { UilArrowUp } from "@tooni/iconscout-unicons-react";
import { Button } from "@ui/button";

interface Props {
  proposal: number;
}

export function ProposalVoteBtn({ proposal }: Props) {
  const activeUser = useGlobalStore((s) => s.activeUser);

  const { data, isLoading } = getProposalVotesQuery(
    proposal,
    activeUser?.username ?? "",
    1
  ).useClientQuery();
  const votes = useMemo(
    () => data?.pages?.reduce((acc, page) => [...acc, ...page], []),
    [data?.pages]
  );
  const voted = useMemo(
    () => (votes?.length ?? 0) > 0 && votes?.[0].voter === activeUser?.username,
    [activeUser?.username, votes]
  );

  const { mutateAsync: voteByKey, isPending: isVotingByKey } = useProposalVoteByKey(proposal);
  const { mutateAsync: voteByKeychain, isPending: isVotingByKeychain } =
    useProposalVoteByKeychain(proposal);

  const cls = `btn-proposal-vote btn-up-vote vote-btn-lg ${
    isVotingByKey || isVotingByKeychain || isLoading ? "in-progress" : ""
  } ${voted ? "voted" : ""}`;

  if (!activeUser) {
    return (
      <LoginRequired>
        <Button icon={<UilArrowUp />} outline={true} noPadding={true} className="w-[34px]" />
      </LoginRequired>
    );
  }

  return (
    <KeyOrHotDialog
      onKey={(key) => voteByKey({ key })}
      onKc={() => voteByKeychain({})}
      onHot={() => proposalVoteHot(activeUser?.username, proposal, false)}
    >
      <Button
        disabled={isVotingByKey || isVotingByKeychain || isLoading}
        icon={<UilArrowUp />}
        outline={!voted}
        noPadding={true}
        className="w-[34px]"
        isLoading={isVotingByKey}
      />
    </KeyOrHotDialog>
  );
}
