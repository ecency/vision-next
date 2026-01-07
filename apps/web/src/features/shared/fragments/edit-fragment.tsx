import { Fragment } from "@/entities";
import i18next from "i18next";
import { FragmentForm } from "./fragment-form";
import { useEditFragment, useRemoveFragment } from "@ecency/sdk";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { useCallback } from "react";
import { getAccessToken } from "@/utils";

interface Props {
  item: Fragment;
  onUpdate: () => void;
  onCancel: () => void;
}

export function EditFragment({ item, onUpdate, onCancel }: Props) {
  const { activeUser } = useActiveAccount();
  if (!activeUser) {
    return null;
  }

  const accessToken = getAccessToken(activeUser.username);
  const { mutateAsync: updateFragment, isPending: isUpdateLoading } = useEditFragment(
    activeUser.username,
    item.id,
    accessToken
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
