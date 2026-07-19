import React, { useMemo } from "react";
import i18next from "i18next";
import "./_index.scss";
import { LoginRequired } from "@/features/shared";
import { useProposalVoteMutation } from "@/api/sdk-mutations";
import { getProposalVotesInfiniteQueryOptions, ProposalVoteRow } from "@ecency/sdk";
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
    () =>
      data?.pages?.reduce(
        (acc: ProposalVoteRow[], page: ProposalVoteRow[]) => [...acc, ...page],
        []
      ),
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
        <Button icon={<UilArrowUp />} outline={true} noPadding={true} className="w-[34px]" aria-label={i18next.t("proposals.vote", { defaultValue: "Vote for proposal" })} />
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
      aria-label={i18next.t("proposals.vote", { defaultValue: "Vote for proposal" })}
      aria-pressed={voted}
    />
  );
}
