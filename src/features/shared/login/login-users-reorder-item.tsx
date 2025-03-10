import { User } from "@/entities";
import { ListItem } from "@/features/ui/list";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { UilDraggabledots } from "@tooni/iconscout-unicons-react";
import { UserAvatar } from "../user-avatar";

interface Props {
  u: User;
}

export function LoginUsersReorderItem({ u }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: u.username
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };
  return (
    <ListItem
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-gray-100 dark:bg-gray-900 !flex items-center gap-2"
    >
      <UilDraggabledots className="w-4 h-4 cursor-grab" />
      <UserAvatar username={u.username} size="medium" />
      <span>{u.username}</span>
    </ListItem>
  );
}
