import { EcencyQueriesManager, QueryIdentifiers } from "@/core/react-query";
import { client } from "@/api/hive";
import { parseAsset } from "@/utils";
import numeral from "numeral";

export const getChainPropertiesQuery = () =>
  EcencyQueriesManager.generateClientServerQuery({
    queryKey: [QueryIdentifiers.CHAIN_PROPERTIES],
    queryFn: async () => {
      const r = await client.database.getChainProperties();
      const asset = parseAsset(r.account_creation_fee.toString());
      return `${numeral(asset.amount).format("0.000")} ${asset.symbol}`;
    },
    refetchOnMount: true
  });
