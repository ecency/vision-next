import React from "react";
import useInterval from "react-use/lib/useInterval";
import { useTimeoutFn } from "react-use";
import { useRecordUserActivity } from "@/api/mutations";

export function UserActivityRecorder() {
  const { mutate } = useRecordUserActivity();

  useTimeoutFn(() => mutate({ ty: 10 }), 5000);

  useInterval(() => mutate({ ty: 10 }), 1000 * 60 * 15 + 8);

  return <></>;
}
