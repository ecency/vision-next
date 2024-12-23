"use client";

import React, { useMemo } from "react";
import "./_index.scss";
import { KeyOrHotDialog, LoginRequired } from "@/features/shared";
import { chevronUpSvg } from "@ui/svg";
import { useVoteWitness } from "@/api/mutations";
import { Button } from "@ui/button";
import { useWitnessVotesQuery } from "@/app/witnesses/_queries";
import { useGlobalStore } from "@/core/global-store";

interface Props {
  witness: string;
}

export function WitnessVoteBtn({ witness }: Props) {
  const activeUser = useGlobalStore((s) => s.activeUser);
  const { data: witnessVotes } = useWitnessVotesQuery();

  const { mutateAsync: vote, isPending } = useVoteWitness(witness);

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
    />
  );

  return activeUser ? (
    <KeyOrHotDialog
      onKey={(key) => vote({ kind: "app", key, voted })}
      onHot={() => vote({ kind: "hot", voted })}
      onKc={() => vote({ kind: "kc", voted })}
    >
      {btn}
    </KeyOrHotDialog>
  ) : (
    <LoginRequired>{btn}</LoginRequired>
  );
}
