import { useMutation } from "@tanstack/react-query";
import { useMarkNotifications } from "@/api/mutations";

export function useMarkNotificationsList(onSuccess: () => void) {
  const { mutateAsync: markAsRead } = useMarkNotifications();

  return useMutation({
    mutationKey: ["markNotifications"],
    mutationFn: ({ set }: { set: Set<string> }) =>
      Promise.all(Array.from(set).map((item) => markAsRead({ id: item }))),
    onSuccess
  });
}
