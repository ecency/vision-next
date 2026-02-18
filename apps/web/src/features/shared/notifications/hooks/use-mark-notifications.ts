import { useMutation } from "@tanstack/react-query";
import { useMarkNotificationsMutation } from "@/api/sdk-mutations";

export function useMarkNotificationsList(onSuccess: () => void) {
  const { mutateAsync: markAsRead } = useMarkNotificationsMutation();

  return useMutation({
    mutationKey: ["markNotifications"],
    mutationFn: ({ set }: { set: Set<string> }) =>
      Promise.all(Array.from(set).map((item) => markAsRead({ id: item }))),
    onSuccess
  });
}
