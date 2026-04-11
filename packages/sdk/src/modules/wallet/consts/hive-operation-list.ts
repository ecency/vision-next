import { utils } from "@ecency/hive-tx";
import type { HiveOperationName } from "../types";

export const HIVE_OPERATION_LIST = Object.keys(
  utils.operations
) as HiveOperationName[];
