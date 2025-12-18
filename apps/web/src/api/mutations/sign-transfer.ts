import { useMutation, UseQueryResult } from "@tanstack/react-query";
import {
  claimInterest,
  claimInterestHot,
  claimInterestKc,
  convert,
  convertHot,
  convertKc,
  delegateVestingShares,
  delegateVestingSharesHot,
  delegateVestingSharesKc,
  formatError,
  transfer,
  transferFromSavings,
  transferFromSavingsHot,
  transferFromSavingsKc,
  transferHot,
  transferKc,
  transferPoint,
  transferPointHot,
  transferPointKc,
  transferToSavings,
  transferToSavingsHot,
  transferToSavingsKc,
  transferToVesting,
  transferToVestingHot,
  transferToVestingKc,
  withdrawVesting,
  withdrawVestingHot,
  withdrawVestingKc
} from "@/api/operations";
import {
  transferEngineTokenByHs,
  transferEngineTokenByKey,
  transferEngineTokenByKeychain
} from "@/api/hive-engine";
import { hpToVests } from "@/features/shared/transfer/hp-to-vests";
import { error, TransferAsset, TransferMode } from "@/features/shared";
import { PrivateKey, TransactionConfirmation } from "@hiveio/dhive";
import { DEFAULT_DYNAMIC_PROPS, getDynamicPropsQuery } from "@/api/queries";
import { TxResponse } from "@/types";
import {
  sendLarynxByHs,
  sendSpkByHs,
  transferLarynxByKey,
  transferLarynxByKc,
  transferSpkByKey,
  transferSpkByKc
} from "@/api/spk-api";

// Helper to safely read hivePerMVests with a typed fallback
const useHivePerMVests = () => {
  const { data } = (getDynamicPropsQuery().useClientQuery() as UseQueryResult<
      typeof DEFAULT_DYNAMIC_PROPS,
      Error
  >);
  return (data ?? DEFAULT_DYNAMIC_PROPS).hivePerMVests;
};

export function useSignTransferByKey(mode: TransferMode, asset: TransferAsset) {
  const hivePerMVests = useHivePerMVests();

  return useMutation({
    mutationKey: ["signTransfer", mode, asset],
    mutationFn: async ({
                         username,
                         key,
                         to,
                         fullAmount,
                         memo,
                         amount
                       }: {
      username: string;
      key: PrivateKey;
      to: string;
      fullAmount: string;
      memo: string;
      amount: string;
    }) => {
      let promise: Promise<TransactionConfirmation>;

      switch (mode) {
        case "transfer":
          if (asset === "POINT") {
            promise = transferPoint(username, key, to, fullAmount, memo);
          } else if (asset === "SPK") {
            promise = transferSpkByKey(username, key, to, amount, memo);
          } else if (asset === "LARYNX") {
            promise = transferLarynxByKey(username, key, to, amount, memo);
          } else if (asset !== "HIVE" && asset !== "HBD") {
            promise = transferEngineTokenByKey(username, key, to, asset, amount, memo);
          } else {
            promise = transfer(username, key, to, fullAmount, memo);
          }
          break;

        case "transfer-saving":
          promise = transferToSavings(username, key, to, fullAmount, memo);
          break;

        case "convert":
          promise = convert(username, key, fullAmount);
          break;

        case "withdraw-saving":
          promise = transferFromSavings(username, key, to, fullAmount, memo);
          break;

        case "claim-interest":
          promise = claimInterest(username, key, to, fullAmount, memo);
          break;

        case "power-up":
          promise = transferToVesting(username, key, to, fullAmount);
          break;

        case "power-down": {
          const vests = hpToVests(Number(amount), hivePerMVests);
          promise = withdrawVesting(username, key, vests);
          break;
        }

        case "delegate": {
          const vests = hpToVests(Number(amount), hivePerMVests);
          promise = delegateVestingShares(username, key, to, vests);
          break;
        }

        default:
          return undefined;
      }

      return promise;
    },
    onError: (err) => error(...formatError(err))
  });
}

export function useSignTransferByKeychain(mode: TransferMode, asset: TransferAsset) {
  const hivePerMVests = useHivePerMVests();

  return useMutation({
    mutationKey: ["signTransferByKeychain", mode, asset],
    mutationFn: async ({
                         username,
                         to,
                         fullAmount,
                         memo,
                         amount
                       }: {
      username: string;
      to: string;
      fullAmount: string;
      memo: string;
      amount: string;
    }) => {
      let promise: Promise<TxResponse>;

      switch (mode) {
        case "transfer":
          if (asset === "POINT") {
            promise = transferPointKc(username, to, fullAmount, memo);
          } else if (asset === "SPK") {
            promise = transferSpkByKc(username, to, amount, memo);
          } else if (asset === "LARYNX") {
            promise = transferLarynxByKc(username, to, amount, memo);
          } else if (asset !== "HIVE" && asset !== "HBD") {
            promise = transferEngineTokenByKeychain(username, to, asset, amount, memo);
          } else {
            promise = transferKc(username, to, fullAmount, memo);
          }
          break;

        case "transfer-saving":
          promise = transferToSavingsKc(username, to, fullAmount, memo);
          break;

        case "convert":
          promise = convertKc(username, fullAmount);
          break;

        case "withdraw-saving":
          promise = transferFromSavingsKc(username, to, fullAmount, memo);
          break;

        case "claim-interest":
          promise = claimInterestKc(username, to, fullAmount, memo);
          break;

        case "power-up":
          promise = transferToVestingKc(username, to, fullAmount);
          break;

        case "power-down": {
          const vests = hpToVests(Number(amount), hivePerMVests);
          promise = withdrawVestingKc(username, vests);
          break;
        }

        case "delegate": {
          const vests = hpToVests(Number(amount), hivePerMVests);
          promise = delegateVestingSharesKc(username, to, vests);
          break;
        }

        default:
          return undefined;
      }

      return promise;
    },
    onError: (err) => error(...formatError(err))
  });
}

export function useSignTransferByHiveSigner(mode: TransferMode, asset: TransferAsset) {
  const hivePerMVests = useHivePerMVests();

  return useMutation({
    mutationKey: ["signTransferByHiveSigner", mode, asset],
    mutationFn: async ({
                         username,
                         to,
                         fullAmount,
                         memo,
                         amount
                       }: {
      username: string;
      to: string;
      fullAmount: string;
      memo: string;
      amount: string;
    }) => {
      switch (mode) {
        case "transfer":
          if (asset === "POINT") {
            transferPointHot(username, to, fullAmount, memo);
          } else if (asset === "SPK") {
            sendSpkByHs(username, to, amount, memo);
          } else if (asset === "LARYNX") {
            sendLarynxByHs(username, to, amount, memo);
          } else if (asset !== "HIVE" && asset !== "HBD") {
            transferEngineTokenByHs(username, to, asset, amount, memo);
          } else {
            transferHot(username, to, fullAmount, memo);
          }
          break;

        case "transfer-saving":
          transferToSavingsHot(username, to, fullAmount, memo);
          break;

        case "convert":
          convertHot(username, fullAmount);
          break;

        case "withdraw-saving":
          transferFromSavingsHot(username, to, fullAmount, memo);
          break;

        case "claim-interest":
          claimInterestHot(username, to, fullAmount, memo);
          break;

        case "power-up":
          transferToVestingHot(username, to, fullAmount);
          break;

        case "power-down": {
          const vests = hpToVests(Number(amount), hivePerMVests);
          withdrawVestingHot(username, vests);
          break;
        }

        case "delegate": {
          const vests = hpToVests(Number(amount), hivePerMVests);
          delegateVestingSharesHot(username, to, vests);
          break;
        }

        default:
          return;
      }
    },
    onError: (err) => error(...formatError(err))
  });
}
