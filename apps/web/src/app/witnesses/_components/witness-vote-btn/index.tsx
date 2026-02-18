"use client";

import { useActiveAccount } from "@/core/hooks/use-active-account";

import React, { useMemo } from "react";
import "./_index.scss";
import { LoginRequired } from "@/features/shared";
import { chevronUpSvg } from "@ui/svg";
import { useWitnessVoteMutation } from "@/api/sdk-mutations";
import { Button } from "@ui/button";
import { useWitnessVotesQuery } from "@/app/witnesses/_queries";

interface Props {
  witness: string;
}

export function WitnessVoteBtn({ witness }: Props) {
  const { activeUser } = useActiveAccount();
  const { data: witnessVotes } = useWitnessVotesQuery();

  const { mutateAsync: vote, isPending } = useWitnessVoteMutation(witness);

  const voted = useMemo(() => witnessVotes?.includes(witness) === true, [witness, witnessVotes]);

  const btn = (
    <Button
      size="sm"
      noPadding={true}
      className="w-8"
      icon={chevronUpSvg}
      appearance={voted ? "pressed" : "primary"}
      outline={!voted}
      disabled={witness === ""}
      isLoading={isPending}
      onClick={activeUser ? () => vote({ approve: !voted }) : undefined}
    />
  );

  return activeUser ? btn : <LoginRequired>{btn}</LoginRequired>;
}
