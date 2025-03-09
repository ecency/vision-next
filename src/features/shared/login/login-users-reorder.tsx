import { useGlobalStore } from "@/core/global-store";
import { Button, Modal, ModalBody, ModalHeader } from "@/features/ui";
import { List } from "@/features/ui/list";
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
import i18next from "i18next";
import { useCallback, useEffect, useState } from "react";
import { LoginUsersReorderItem } from "./login-users-reorder-item";

export function LoginUsersReorder() {
  const users = useGlobalStore((state) => state.users);
  const setUsers = useGlobalStore((state) => state.setUsers);

  const [show, setShow] = useState(false);
  const [list, setList] = useState(
    users.map((u) => ({
      ...u,
      id: u.username
    }))
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  useEffect(() => setUsers(list), [list]);

  const handleDragEnd = useCallback(({ active, over }: DragEndEvent) => {
    if (active.id !== over?.id) {
      setList((list) => {
        const oldIndex = list.findIndex((u) => u.id === active.id);
        const newIndex = list.findIndex((u) => u.id === over!.id);
        return arrayMove(list, oldIndex, newIndex)
          .map((u, index) => ({
            ...u,
            index
          }))
          .sort((a, b) => (a.index ?? 0) - (b?.index ?? 0));
      });
    }
  }, []);

  return (
    <>
      <Button noPadding={true} size="xs" appearance="link" onClick={() => setShow(true)}>
        {i18next.t("login.reorder-list")}
      </Button>
      <Modal show={show} onHide={() => setShow(false)} centered={true}>
        <ModalHeader closeButton={true}>{i18next.t("login.reorder")}</ModalHeader>
        <ModalBody>
          <List>
            <DndContext
              onDragEnd={handleDragEnd}
              modifiers={[restrictToVerticalAxis, restrictToWindowEdges, restrictToParentElement]}
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
        </ModalBody>
      </Modal>
    </>
  );
}
