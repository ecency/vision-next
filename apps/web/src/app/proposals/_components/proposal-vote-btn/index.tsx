import React, { useMemo } from "react";
import "./_index.scss";
import { KeyOrHotDialog, LoginRequired } from "@/features/shared";
import { useProposalVoteByKey, useProposalVoteByKeychain } from "@/api/mutations/proposal-vote";
import { proposalVoteHot } from "@/api/operations";
import { getProposalVotesInfiniteQueryOptions } from "@ecency/sdk";
import { UilArrowUp } from "@tooni/iconscout-unicons-react";
import { Button } from "@ui/button";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { useInfiniteQuery } from "@tanstack/react-query";

interface Props {
  proposal: number;
}

export function ProposalVoteBtn({ proposal }: Props) {
  const { activeUser } = useActiveAccount();

  const { data, isLoading } = useInfiniteQuery(
    getProposalVotesInfiniteQueryOptions(proposal, activeUser?.username ?? "", 1)
  );
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

  if (!activeUser) {
    return (
      <LoginRequired>
        <Button icon={<UilArrowUp />} outline={true} noPadding={true} className="w-[34px]" />
      </LoginRequired>
    );
  }

  return (
    <KeyOrHotDialog
      onKey={(key) => voteByKey({ key, approve: !voted })}
      onKc={() => voteByKeychain({ approve: !voted })}
      onHot={() => proposalVoteHot(activeUser?.username, proposal, !voted)}
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
