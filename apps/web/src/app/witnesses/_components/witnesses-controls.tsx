import { WitnessesExtra } from "@/app/witnesses/_components/witnesses-extra";
import { useQueryClient } from "@tanstack/react-query";
import { QueryIdentifiers } from "@/core/react-query";
import { useWitnessProxyQuery, useWitnessVotesQuery } from "@/app/witnesses/_queries";
import { WitnessesProxy } from "@/app/witnesses/_components/witness-proxy";
import { useMemo } from "react";
import { WitnessTransformed } from "@/entities";

interface Props {
  witnesses: WitnessTransformed[];
}

export function WitnessesControls({ witnesses }: Props) {
  const queryClient = useQueryClient();

  const { data: witnessVotes } = useWitnessVotesQuery();
  const { data: proxyInfo } = useWitnessProxyQuery();
  const hasActiveUserProxy = Boolean(proxyInfo?.activeUserProxy);

  const extraWitnesses = useMemo(
    () => witnessVotes?.filter((w) => !witnesses.find((y) => y.name === w)) ?? [],
    [witnesses, witnessVotes]
  );

  return hasActiveUserProxy ? (
    <></>
  ) : (
    <div className="witnesses-controls">
      <WitnessesExtra list={extraWitnesses} />
      <div className="flex-spacer" />

      <WitnessesProxy
        onDone={() => queryClient.invalidateQueries({ queryKey: [QueryIdentifiers.WITNESSES, "proxy"] })}
      />
    </div>
  );
}
