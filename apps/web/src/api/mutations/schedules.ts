import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteSchedule, moveSchedule } from "@/api/private-api";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { QueryIdentifiers } from "@/core/react-query";

export function useMoveSchedule() {
  const queryClient = useQueryClient();
  const { activeUser } = useActiveAccount();

  return useMutation({
    mutationKey: ["schedules", "move", activeUser?.username],
    mutationFn: ({ id }: { id: string }) => moveSchedule(activeUser!.username, id),
    onSuccess: (schedules) => {
      queryClient.setQueryData([QueryIdentifiers.SCHEDULES, activeUser?.username], schedules);
    }
  });
}

export function useDeleteSchedule() {
  const queryClient = useQueryClient();
  const { activeUser } = useActiveAccount();

  return useMutation({
    mutationKey: ["schedules", "delete", activeUser?.username],
    mutationFn: ({ id }: { id: string }) => deleteSchedule(activeUser!.username, id),
    onSuccess: (schedules) => {
      queryClient.setQueryData([QueryIdentifiers.SCHEDULES, activeUser?.username], schedules);
    }
  });
}
