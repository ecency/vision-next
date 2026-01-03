import { EcencyQueriesManager } from "@/core/react-query";
import { getChainPropertiesQueryOptions } from "@ecency/sdk";
import { parseAsset } from "@/utils";
import numeral from "numeral";

export const getChainPropertiesQuery = () => {
  const sdkQuery = getChainPropertiesQueryOptions();

  return EcencyQueriesManager.generateClientServerQuery({
    ...sdkQuery,
    // Transform SDK data to app-specific format
    select: (data) => {
      const asset = parseAsset(data.account_creation_fee.toString());
      return `${numeral(asset.amount).format("0.000")} ${asset.symbol}`;
    },
  });
};
