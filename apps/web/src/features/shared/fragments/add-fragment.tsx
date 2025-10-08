import i18next from "i18next";
import { FragmentForm } from "./fragment-form";
import { useAddFragment } from "@ecency/sdk";
import { useGlobalStore } from "@/core/global-store";
import { useCallback } from "react";

interface Props {
  onAdd: () => void;
  onCancel: () => void;
}

export function AddFragment({ onAdd, onCancel }: Props) {
  const activeUser = useGlobalStore((state) => state.activeUser);
  const { mutateAsync: addFragment, isPending } = useAddFragment(activeUser!.username);

  const submit = useCallback(
    async (title: string, body: string) => {
      await addFragment({ title, body });
      onAdd();
    },
    [addFragment, onAdd]
  );

  return (
    <FragmentForm
      onCancel={onCancel}
      isLoading={isPending}
      onSubmit={submit}
      submitButtonText={i18next.t("g.add")}
    />
  );
}
