"use client";

import { useMutation } from "@tanstack/react-query";
import {
  useDeleteScheduleMutation,
  useMoveScheduleMutation
} from "@/api/sdk-mutations";

export function useMoveSchedule() {
  const { mutateAsync: sdkMoveSchedule } = useMoveScheduleMutation();

  return useMutation({
    mutationKey: ["schedules", "move"],
    mutationFn: async ({ id }: { id: string }) => {
      return sdkMoveSchedule({ id });
    }
  });
}

export function useDeleteSchedule() {
  const { mutateAsync: sdkDeleteSchedule } = useDeleteScheduleMutation();

  return useMutation({
    mutationKey: ["schedules", "delete"],
    mutationFn: async ({ id }: { id: string }) => {
      return sdkDeleteSchedule({ id });
    }
  });
}
