import { useUpdateCommunity } from "@/api/mutations";
import { useClientActiveUser } from "@/api/queries";
import { Community } from "@/entities";
import { normalizeBeneficiaryWeight } from "@/utils";
import { getAccountFullQueryOptions, useAccountUpdate } from "@ecency/sdk";
import { yupResolver } from "@hookform/resolvers/yup";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@ui/button";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "@ui/modal";
import i18next from "i18next";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import * as yup from "yup";
import { CommunitySettingsAdvanced } from "./community-settings-advanced";
import { CommunitySettingsGeneralInfo } from "./community-settings-general-info";

interface Props {
  community: Community;
  onHide: () => void;
}

const form = yup.object({
  title: yup
    .string()
    .required(i18next.t("validation.required"))
    .min(3, i18next.t("validation.min-length", { n: 3 }))
    .max(20, i18next.t("validation.max-length", { n: 20 }))
    .trim(),
  about: yup.string().required(i18next.t("validation.required")).trim(),
  lang: yup.string().required(i18next.t("validation.required")).trim(),
  description: yup.string().required(i18next.t("validation.required")).trim(),
  rules: yup.string().required(i18next.t("validation.required")).trim(),
  nsfw: yup.boolean().required(i18next.t("validation.required")),
  defaultBeneficiaryUsername: yup.string().trim().optional(),
  defaultBeneficiaryReward: yup.number().optional().positive().min(1).max(100)
});

export function CommunitySettingsDialog({ onHide, community }: Props) {
  const activeUser = useClientActiveUser();

  const router = useRouter();
  const methods = useForm({
    resolver: yupResolver(form),
    defaultValues: {
      title: community.title,
      about: community.about,
      description: community.description,
      lang: community.lang,
      rules: community.flag_text,
      nsfw: community.is_nsfw,
      defaultBeneficiaryReward: 5
    }
  });

  const { data: communityOwnerAccount } = useQuery(getAccountFullQueryOptions(community.name));

  const { mutateAsync: updateAccount } = useAccountUpdate(activeUser?.username ?? "");
  const { mutateAsync: updateCommunity, isPending } = useUpdateCommunity(community.name);

  useEffect(() => {
    if (communityOwnerAccount) {
      try {
        const meta = JSON.parse(communityOwnerAccount.posting_json_metadata);
        const beneficiary = (meta?.profile ?? meta)?.beneficiary;
        const weight = normalizeBeneficiaryWeight(beneficiary?.weight);

        if (typeof beneficiary?.account === "string") {
          methods.setValue("defaultBeneficiaryUsername", beneficiary.account);
        }

        if (weight !== undefined) {
          methods.setValue("defaultBeneficiaryReward", weight / 100);
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, [communityOwnerAccount, methods]);

  const onSubmit = methods.handleSubmit(
    async ({
      title,
      about,
      description,
      lang,
      rules,
      nsfw,
      defaultBeneficiaryReward,
      defaultBeneficiaryUsername
    }) => {
      await updateCommunity({
        payload: {
          title,
          about,
          description,
          lang,
          flag_text: rules,
          is_nsfw: nsfw
        }
      });

      // Only owner can update the beneficiaries settings because this setting is storing in account itself
      if (
        activeUser?.username === community.name &&
        defaultBeneficiaryUsername &&
        defaultBeneficiaryReward
      ) {
        await updateAccount({
          profile: {
            beneficiary: {
              account: defaultBeneficiaryUsername,
              weight: defaultBeneficiaryReward * 100
            }
          }
        });
      }

      onHide();
      setTimeout(() => router.refresh(), 3000);
    }
  );

  return (
    <Modal
      show={true}
      centered={true}
      onHide={onHide}
      className="community-settings-dialog"
      size="lg"
    >
      <FormProvider {...methods}>
        <form className="flex flex-col gap-4" onSubmit={onSubmit}>
          <ModalHeader closeButton={true}>
            {i18next.t("community-settings.dialog-title")}
          </ModalHeader>
          <ModalBody className="!p-0">
            <div className="community-settings-dialog-content">
              <div className="flex flex-col gap-4">
                <CommunitySettingsGeneralInfo />

                <div className="border-b border-[--border-color] w-full" />

                <CommunitySettingsAdvanced />
                <ModalFooter className="flex justify-end">
                  <Button type="submit" disabled={isPending} isLoading={isPending}>
                    {i18next.t("g.save")}
                  </Button>
                </ModalFooter>
              </div>
            </div>
          </ModalBody>
        </form>
      </FormProvider>
    </Modal>
  );
}
