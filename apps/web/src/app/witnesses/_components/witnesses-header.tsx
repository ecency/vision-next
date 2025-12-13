"use client";

import { Tsx } from "@/features/i18n/helper";
import React from "react";
import i18next from "i18next";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { useWitnessProxyQuery, useWitnessVotesQuery } from "@/app/witnesses/_queries";

export function WitnessesHeader() {
  const { activeUser } = useActiveAccount();
  const { data: witnessVotes } = useWitnessVotesQuery();
  const { data: proxyInfo } = useWitnessProxyQuery();

  const votesRemaining = proxyInfo?.highlightedProxy
    ? 0
    : Math.max(0, 30 - (witnessVotes?.length ?? 0));

  return (
    <div className="page-header mt-5">
      <div className="header-title">{i18next.t("witnesses.page-title")}</div>
      <Tsx k="witnesses.page-description-long">
        <div className="header-description" />
      </Tsx>
      {activeUser && (
        <Tsx k="witnesses.remaining" args={{ n: votesRemaining, max: 30 }}>
          <div className="remaining" />
        </Tsx>
      )}
    </div>
  );
}
