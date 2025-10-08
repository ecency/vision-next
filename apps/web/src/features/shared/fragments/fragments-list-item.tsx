import { MouseEvent } from "react";
import { useGlobalStore } from "@/core/global-store";
import { Button } from "@/features/ui";
import { Fragment, useRemoveFragment } from "@ecency/sdk";
import { UilEditAlt, UilTrash } from "@tooni/iconscout-unicons-react";
import { motion } from "framer-motion";

interface Props {
  item: Fragment;
  onPick: () => void;
  onEdit: () => void;
  index: number;
}

export function FragmentsListItem({ item, onPick, onEdit, index }: Props) {
  const activeUser = useGlobalStore((state) => state.activeUser);

  const { mutateAsync: deleteFragment, isPending: isDeleteLoading } = useRemoveFragment(
    activeUser!.username,
    item.id
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex flex-col border dark:border-dark-400 rounded-xl overflow-hidden cursor-pointer hover:opacity-75"
      key={item.id}
      onClick={() => onPick?.()}
    >
      <div className="flex items-center justify-between border-b dark:border-dark-300 px-3 py-2 bg-gray-100 dark:bg-dark-500">
        <div>{item.title}</div>
        <div className="flex gap-4">
          <Button
            appearance="gray-link"
            noPadding={true}
            size="xs"
            icon={<UilEditAlt />}
            onClick={(e: MouseEvent) => {
              e.stopPropagation();
              onEdit();
            }}
          />
          <Button
            appearance="gray-link"
            noPadding={true}
            size="xs"
            icon={<UilTrash />}
            onClick={(e: MouseEvent) => {
              e.stopPropagation();
              deleteFragment();
            }}
          />
        </div>
      </div>
      <div
        className="text-gray-steel dark:text-white-075 px-3 py-2"
        dangerouslySetInnerHTML={{ __html: item.body.slice(0, 200) }}
      ></div>
    </motion.div>
  );
}
