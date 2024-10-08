import React, { useState } from "react";
import {
  delegateByHs,
  delegateByKc,
  delegateByKey,
  powerByHs,
  powerByKc,
  powerByKey,
  transferByHs,
  transferByKc,
  transferByKey
} from "./util";
import { lockByHs, lockByKc, lockByKey } from "./util/lock";
import { Button } from "@ui/button";
import { PrivateKey } from "@hiveio/dhive";
import { getAccountFull } from "@/api/hive";
import { formatError } from "@/api/operations";
import { error, KeyOrHot } from "@/features/shared";
import i18next from "i18next";
import { useGlobalStore } from "@/core/global-store";

interface Props {
  onBack: () => void;
  amount: string;
  asset: string;
  memo: string;
  mode: "transfer" | "delegate" | "powerup" | "powerdown" | "lock" | "unlock";
  setNextStep: () => void;
  to: string;
}

export const SendSpkDialogSign = ({
  onBack,
  amount,
  asset,
  memo,
  mode,
  setNextStep,
  to
}: Props) => {
  const activeUser = useGlobalStore((s) => s.activeUser);
  const updateActiveUser = useGlobalStore((s) => s.updateActiveUser);

  const [inProgress, setInProgress] = useState(false);

  const sign = async (key: PrivateKey) => {
    const username = activeUser?.username!;

    let promise: Promise<any>;
    switch (mode) {
      case "transfer":
        promise = transferByKey(key, asset, username, to, amount, memo);
        break;
      case "delegate":
        promise = delegateByKey(key, asset, username, to, amount);
        break;
      case "powerup":
        promise = powerByKey("up", key, asset, username, amount);
        break;
      case "powerdown":
        promise = powerByKey("down", key, asset, username, amount);
        break;
      case "lock":
        promise = lockByKey("lock", key, asset, username, amount);
        break;
      case "unlock":
        promise = lockByKey("unlock", key, asset, username, amount);
        break;
      default:
        return;
    }

    setInProgress(true);
    try {
      // @ts-ignore
      await promise;
      const a = await getAccountFull(activeUser!.username);
      await updateActiveUser(a);
      setNextStep();
    } catch (e) {
      error(...formatError(e));
    } finally {
      setInProgress(false);
    }
  };

  const signHs = () => {
    switch (mode) {
      case "transfer":
        transferByHs(asset, activeUser!.username, to, amount, memo);
        break;
      case "delegate":
        delegateByHs(asset, activeUser!.username, to, amount);
        break;
      case "powerup":
        powerByHs("up", asset, activeUser!.username, amount);
        break;
      case "powerdown":
        powerByHs("down", asset, activeUser!.username, amount);
        break;
      case "lock":
        lockByHs("lock", asset, activeUser!.username, amount);
        break;
      case "unlock":
        lockByHs("unlock", asset, activeUser!.username, amount);
        break;
      default:
        return;
    }
  };

  const signKs = async () => {
    const username = activeUser?.username!;

    let promise: Promise<any>;
    switch (mode) {
      case "transfer":
        promise = transferByKc(asset, username, to, amount, memo);
        break;
      case "delegate":
        promise = delegateByKc(asset, username, to, amount);
        break;
      case "powerup":
        promise = powerByKc("up", asset, username, amount);
        break;
      case "powerdown":
        promise = powerByKc("down", asset, username, amount);
        break;
      case "lock":
        promise = lockByKc("lock", asset, username, amount);
        break;
      case "unlock":
        promise = lockByKc("unlock", asset, username, amount);
        break;
      default:
        return;
    }

    setInProgress(true);
    try {
      // @ts-ignore
      await promise;
      const a = await getAccountFull(activeUser!.username);
      await updateActiveUser(a);
      setNextStep();
    } catch (e) {
      error(...formatError(e));
    } finally {
      setInProgress(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <KeyOrHot
        inProgress={inProgress}
        onKey={(key: PrivateKey) => sign(key)}
        onHot={signHs}
        onKc={signKs}
      />

      <Button appearance="secondary" outline={true} disabled={inProgress} onClick={() => onBack()}>
        {i18next.t("g.back")}
      </Button>
    </div>
  );
};
