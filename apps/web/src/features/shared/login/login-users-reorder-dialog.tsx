import { useCallback, useEffect, useMemo, useState } from "react";
import i18next from "i18next";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import {
  restrictToParentElement,
  restrictToVerticalAxis,
  restrictToWindowEdges
} from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { Button, Modal, ModalBody, ModalHeader } from "@/features/ui";
import { List } from "@/features/ui/list";
import type { User } from "@/entities";
import { LoginUsersReorderItem } from "./login-users-reorder-item";

interface Props {
  users: User[];
  onClose: () => void;
  onReorder: (users: User[]) => void;
}

type SortableUser = User & { id: string };

const buildSortableList = (users: User[]): SortableUser[] =>
  users.map((user, index) => ({ ...user, id: user.username, index }));

export function LoginUsersReorderDialog({ users, onClose, onReorder }: Props) {
  const [list, setList] = useState<SortableUser[]>(() => buildSortableList(users));

  useEffect(() => {
    setList(buildSortableList(users));
  }, [users]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  const modifiers = useMemo(
    () => [restrictToVerticalAxis, restrictToWindowEdges, restrictToParentElement],
    []
  );

  const handleDragEnd = useCallback(
    ({ active, over }: DragEndEvent) => {
      if (!over || active.id === over.id) {
        return;
      }

      setList((current) => {
        const oldIndex = current.findIndex((u) => u.id === active.id);
        const newIndex = current.findIndex((u) => u.id === over.id);

        if (oldIndex === -1 || newIndex === -1) {
          return current;
        }

        const updated = arrayMove(current, oldIndex, newIndex).map((u, index) => ({
          ...u,
          index
        }));

        onReorder(updated.map(({ id, ...rest }) => rest));

        return updated;
      });
    },
    [onReorder]
  );

  return (
    <Modal show={true} onHide={onClose} centered={true}>
      <ModalHeader closeButton={true}>{i18next.t("login.reorder")}</ModalHeader>
      <ModalBody>
        <List>
          <DndContext
            onDragEnd={handleDragEnd}
            modifiers={modifiers}
            sensors={sensors}
            collisionDetection={closestCenter}
          >
            <SortableContext strategy={verticalListSortingStrategy} items={list}>
              {list.map((u) => (
                <LoginUsersReorderItem key={u.username} u={u} />
              ))}
            </SortableContext>
          </DndContext>
        </List>
        <div className="flex justify-end mt-4">
          <Button appearance="gray-link" onClick={onClose}>
            {i18next.t("g.close")}
          </Button>
        </div>
      </ModalBody>
    </Modal>
  );
}
