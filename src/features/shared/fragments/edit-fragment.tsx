import { Fragment } from "@/entities";
import i18next from "i18next";
import { FragmentForm } from "./fragment-form";
import { useEditFragment, useRemoveFragment } from "@ecency/sdk";
import { useGlobalStore } from "@/core/global-store";
import { useCallback } from "react";

interface Props {
  item: Fragment;
  onUpdate: () => void;
  onCancel: () => void;
}

export function EditFragment({ item, onUpdate, onCancel }: Props) {
  const activeUser = useGlobalStore((state) => state.activeUser);
  const { mutateAsync: updateFragment, isPending: isUpdateLoading } = useEditFragment(
    activeUser!.username,
    item.id
  );

  const submit = useCallback(
    async (title: string, body: string) => {
      await updateFragment({ title, body });
      onUpdate();
    },
    [onUpdate, updateFragment]
  );

  return (
    <FragmentForm
      initialData={{ title: item.title, body: item.body }}
      onSubmit={submit}
      onCancel={onCancel}
      isLoading={isUpdateLoading}
      submitButtonText={i18next.t("g.update")}
    />
  );
}
