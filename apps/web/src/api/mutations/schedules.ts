"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { QueryIdentifiers } from "@/core/react-query";
import {
  useDeleteScheduleMutation,
  useMoveScheduleMutation
} from "@/api/sdk-mutations";

export function useMoveSchedule() {
  const queryClient = useQueryClient();
  const { activeUser } = useActiveAccount();
  const { mutateAsync: sdkMoveSchedule } = useMoveScheduleMutation();

  return useMutation({
    mutationKey: ["schedules", "move", activeUser?.username],
    mutationFn: async ({ id }: { id: string }) => {
      return sdkMoveSchedule({ id });
    },
    onSuccess: (schedules) => {
      // Bridge: update web-specific cache key (SDK already updated its key)
      queryClient.setQueryData([QueryIdentifiers.SCHEDULES, activeUser?.username], schedules);
    }
  });
}

export function useDeleteSchedule() {
  const queryClient = useQueryClient();
  const { activeUser } = useActiveAccount();
  const { mutateAsync: sdkDeleteSchedule } = useDeleteScheduleMutation();

  return useMutation({
    mutationKey: ["schedules", "delete", activeUser?.username],
    mutationFn: async ({ id }: { id: string }) => {
      return sdkDeleteSchedule({ id });
    },
    onSuccess: (schedules) => {
      // Bridge: update web-specific cache key (SDK already updated its key)
      queryClient.setQueryData([QueryIdentifiers.SCHEDULES, activeUser?.username], schedules);
    }
  });
}
