import { useCallback } from "react";
import { CustomJsonOperation } from "@hiveio/dhive/lib/chain/operation";

export function useTransferGetOperation() {
  return useCallback(
    ({
      from,
      amount,
      memo,
      mode,
      to,
      asset
    }: {
      from: string;
      amount: string;
      mode: string;
      to: string;
      memo: string;
      asset: string;
    }) => {
      let op: CustomJsonOperation[1] | undefined = undefined;
      switch (mode) {
        case "transfer": {
          op = {
            id: "ssc-mainnet-hive",
            json: JSON.stringify({
              contractName: "tokens",
              contractAction: "transfer",
              contractPayload: {
                symbol: asset,
                to,
                quantity: amount.toString(),
                memo
              }
            }),
            required_auths: [from],
            required_posting_auths: []
          };
          break;
        }
        case "delegate": {
          op = {
            id: "ssc-mainnet-hive",
            json: JSON.stringify({
              contractName: "tokens",
              contractAction: "delegate",
              contractPayload: {
                symbol: asset,
                to,
                quantity: amount.toString()
              }
            }),
            required_auths: [from],
            required_posting_auths: []
          };
          break;
        }
        case "undelegate": {
          op = {
            id: "ssc-mainnet-hive",
            json: JSON.stringify({
              contractName: "tokens",
              contractAction: "undelegate",
              contractPayload: {
                symbol: asset,
                from: to,
                quantity: amount.toString()
              }
            }),
            required_auths: [from],
            required_posting_auths: []
          };
          break;
        }
        case "stake": {
          op = {
            id: "ssc-mainnet-hive",
            json: JSON.stringify({
              contractName: "tokens",
              contractAction: "stake",
              contractPayload: {
                symbol: asset,
                to,
                quantity: amount.toString()
              }
            }),
            required_auths: [from],
            required_posting_auths: []
          };
          break;
        }
        case "unstake": {
          op = {
            id: "ssc-mainnet-hive",
            json: JSON.stringify({
              contractName: "tokens",
              contractAction: "stake",
              contractPayload: {
                symbol: asset,
                to,
                quantity: amount.toString()
              }
            }),
            required_auths: [from],
            required_posting_auths: []
          };
          break;
        }
      }
      return op;
    },
    []
  );
}
