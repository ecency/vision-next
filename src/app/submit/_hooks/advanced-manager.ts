import useLocalStorage from "react-use/lib/useLocalStorage";
import { useMemo, useState } from "react";
import { Advanced } from "../_types";
import useMount from "react-use/lib/useMount";
import { useThreeSpeakManager } from "./three-speak-manager";
import { PREFIX } from "@/utils/local-storage";
import { BeneficiaryRoute, RewardType } from "@/entities";

export function useAdvancedManager() {
  // @deprecated
  const [localAdvanced, setLocalAdvanced, removeLocalAdvanced] = useLocalStorage<Advanced>(
    PREFIX + "local_advanced"
  );

  const [advanced, setAdvanced] = useState(false);
  const [reward, setReward, clearReward] = useLocalStorage<RewardType>(PREFIX + "_sa_r", "default");
  const [beneficiaries, setBeneficiaries, clearBeneficiaries] = useLocalStorage<BeneficiaryRoute[]>(
    PREFIX + "_sa_b",
    []
  );
  const [description, setDescription, clearDescription] = useLocalStorage<string | null>(
    PREFIX + "_sa_d",
    null
  );
  const [schedule, setSchedule, clearSchedule] = useLocalStorage<string | null>(
    PREFIX + "_sa_s",
    null
  );
  const [reblogSwitch, setReblogSwitch, clearSetReblogSwitch] = useLocalStorage(
    PREFIX + "_sa_rb",
    false
  );

  const threeSpeakManager = useThreeSpeakManager();

  const hasAdvanced = () =>
    reward !== "default" ||
    (beneficiaries ?? []).length > 0 ||
    schedule !== null ||
    reblogSwitch ||
    (description !== "" && typeof description === "string");

  const getHasAdvanced = useMemo(
    () => hasAdvanced(),
    [reward, beneficiaries, schedule, reblogSwitch, description]
  );

  useMount(() => {
    if (localAdvanced) {
      setReward(localAdvanced.reward);
      setBeneficiaries(localAdvanced.beneficiaries);
      setSchedule(localAdvanced.schedule);
      setReblogSwitch(localAdvanced.reblogSwitch);
      setDescription(localAdvanced.description);
      threeSpeakManager.setIsNsfw(localAdvanced.isNsfw);

      removeLocalAdvanced();
    }
  });

  return {
    advanced,
    setAdvanced,
    reward: reward!!,
    setReward,
    beneficiaries: beneficiaries ?? [],
    setBeneficiaries,
    description: description ?? null,
    setDescription,
    schedule: schedule!!,
    setSchedule,
    reblogSwitch: reblogSwitch!!,
    setReblogSwitch,

    hasAdvanced,
    getHasAdvanced,

    clearAdvanced: () => {
      setAdvanced(false);
      clearReward();
      clearBeneficiaries();
      clearDescription();
      clearDescription();
      clearSetReblogSwitch();
      clearSchedule();
    }
  };
}
