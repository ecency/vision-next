import i18next from "i18next";
import { FragmentForm } from "./fragment-form";
import { useAddFragment } from "@ecency/sdk";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { useCallback } from "react";

interface Props {
  onAdd: () => void;
  onCancel: () => void;
}

export function AddFragment({ onAdd, onCancel }: Props) {
  const { activeUser } = useActiveAccount();
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
