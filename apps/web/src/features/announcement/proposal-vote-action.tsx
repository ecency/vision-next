import React, { useMemo } from "react";
import i18next from "i18next";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getUserProposalVotesQueryOptions } from "@ecency/sdk";
import { Button } from "@ui/button";
import { success } from "@/features/shared";
import { useProposalVoteMutation } from "@/api/sdk-mutations";
import { useActiveUsername } from "@/core/hooks/use-active-username";

interface Props {
  proposalId: number;
  buttonText: string;
  viewLink: string;
  onSupported: () => void;
}

/**
 * Inline "support this proposal" action for proposal-type announcements.
 *
 * Instead of only linking to the proposal page, this casts the
 * `update_proposal_votes` operation directly via the existing SDK mutation
 * (active authority — the SDK surfaces the auth-upgrade dialog when the user is
 * logged in with a posting key only). We build the operation client-side from a
 * known proposal id rather than broadcasting any server-provided op blob.
 *
 * A secondary "view proposal" link is always offered so users can read the
 * proposal first, and users who have already voted see a confirmation instead of
 * being asked again.
 */
export function ProposalVoteAction({ proposalId, buttonText, viewLink, onSupported }: Props) {
  const username = useActiveUsername();

  const { data: userVotes } = useQuery({
    ...getUserProposalVotesQueryOptions(username ?? ""),
    enabled: !!username
  });

  const voted = useMemo(
    () => !!userVotes?.some((vote) => vote.proposal?.proposal_id === proposalId),
    [userVotes, proposalId]
  );

  const { mutateAsync: vote, isPending } = useProposalVoteMutation(proposalId);

  const onSupport = async () => {
    try {
      await vote({ approve: true });
      success(i18next.t("announcements.vote-success"));
      onSupported();
    } catch {
      // Broadcast/auth errors are surfaced by the web broadcast adapter; swallow
      // here so a declined signature doesn't bubble up as an unhandled rejection.
    }
  };

  if (voted) {
    return (
      <>
        <Button appearance="success" outline={true} disabled={true}>
          {i18next.t("announcements.voted")}
        </Button>
        <Link href={viewLink} onClick={onSupported}>
          <Button appearance="link">{i18next.t("announcements.view-proposal")}</Button>
        </Link>
      </>
    );
  }

  return (
    <>
      <Button isLoading={isPending} disabled={isPending} onClick={onSupport}>
        {buttonText}
      </Button>
      <Link href={viewLink}>
        <Button appearance="link">{i18next.t("announcements.view-proposal")}</Button>
      </Link>
    </>
  );
}
