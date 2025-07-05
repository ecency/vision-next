import {
  useCreateCommunityByApi,
  useCreateCommunityByHivesigner,
  useCreateCommunityByKeychain
} from "@/api/mutations";
import { KeyOrHot } from "@/features/shared";
import { PrivateKey } from "@hiveio/dhive";
import { useCallback } from "react";
import { CommunityCreateCardLayout } from "./community-create-card-layout";

interface Props {
  username: string;
  wif: string;
  fee: string | undefined;
  title: string;
  about: string;
  onSubmit: (code: string) => void;
}

export function CommunityCreateSignStep({ username, wif, fee, title, about, onSubmit }: Props) {
  const { mutateAsync: submitApi, isPending: isApiPending } = useCreateCommunityByApi();
  const { mutateAsync: submitKc, isPending: isKcPending } = useCreateCommunityByKeychain();
  const { mutateAsync: submitHs } = useCreateCommunityByHivesigner();

  const onApi = useCallback(
    async (creatorKey: PrivateKey) => {
      const code = await submitApi({ creatorKey, fee: fee!, wif, username });
      onSubmit(code);
    },
    [fee, submitApi, username, wif]
  );

  const onHs = useCallback(
    () => submitHs({ title, about, fee: fee!, wif, username }),
    [about, fee, submitHs, title, username, wif]
  );

  const onKc = useCallback(async () => {
    const code = await submitKc({ username, wif, fee: fee! });
    onSubmit(code);
  }, [fee, submitKc, username, wif]);

  return (
    <CommunityCreateCardLayout>
      <KeyOrHot
        inProgress={isApiPending || isKcPending}
        onKey={(key) => onApi(key)}
        onKc={() => onKc()}
        onHot={() => onHs()}
      />
    </CommunityCreateCardLayout>
  );
}
