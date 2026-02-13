import React, { useMemo } from "react";
import "./_index.scss";
import { LoginRequired } from "@/features/shared";
import { useProposalVoteMutation } from "@/api/sdk-mutations";
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

  const { mutateAsync: vote, isPending } = useProposalVoteMutation(proposal);

  if (!activeUser) {
    return (
      <LoginRequired>
        <Button icon={<UilArrowUp />} outline={true} noPadding={true} className="w-[34px]" />
      </LoginRequired>
    );
  }

  return (
    <Button
      disabled={isPending || isLoading}
      icon={<UilArrowUp />}
      outline={!voted}
      noPadding={true}
      className="w-[34px]"
      isLoading={isPending}
      onClick={() => vote({ approve: !voted })}
    />
  );
}
