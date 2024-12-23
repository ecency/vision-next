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
  const { data: proxy } = useWitnessProxyQuery();

  const extraWitnesses = useMemo(
    () => witnessVotes?.filter((w) => !witnesses.find((y) => y.name === w)) ?? [],
    [witnesses, witnessVotes]
  );

  return proxy ? (
    <></>
  ) : (
    <div className="witnesses-controls">
      <WitnessesExtra list={extraWitnesses} />
      <div className="flex-spacer" />

      <WitnessesProxy
        onDone={(username) =>
          queryClient.setQueryData<string>([QueryIdentifiers.WITNESSES, "proxy"], username)
        }
      />
    </div>
  );
}
