import { LoginRequired } from "@/features/shared";
import { Button } from "@ui/button";
import { Spinner } from "@ui/spinner";
import i18next from "i18next";
import { contentLoadSvg, contentSaveSvg } from "@/assets/img/svg";
import { EcencyConfigManager } from "@/config";
import { DraftsDialog } from "@/features/shared/drafts";
import React, { useCallback } from "react";
import { usePublishApi, useSaveDraftApi, useScheduleApi, useUpdateApi } from "@/app/submit/_api";
import { makeEntryPath } from "@/utils";
import { BeneficiaryRoute, Draft, Entry, RewardType } from "@/entities";
import { useRouter } from "next/navigation";
import { useGlobalStore } from "@/core/global-store";

interface Props {
  editingEntry: Entry | null;
  editingDraft: Draft | null;
  schedule: string;
  onClear: () => void;
  isDraftEmpty: boolean;
  drafts: boolean;
  setDrafts: (value: boolean) => void;
  title: string;
  tags: string[];
  body: string;
  reward: RewardType;
  reblogSwitch: boolean;
  beneficiaries: BeneficiaryRoute[];
  description: string | null;
  selectedThumbnail: string | undefined;
  selectionTouched: boolean;
  validate: () => boolean;
  disabled: boolean;
}

export function EditorActions({
  schedule,
  onClear,
  editingEntry,
  editingDraft,
  isDraftEmpty,
  drafts,
  setDrafts,
  title,
  body,
  tags,
  reblogSwitch,
  reward,
  beneficiaries,
  description,
  selectedThumbnail,
  selectionTouched,
  validate,
  disabled
}: Props) {
  const activeUser = useGlobalStore((s) => s.activeUser);
  const router = useRouter();

  const { mutateAsync: doSchedule, isPending: posting } = useScheduleApi(onClear);
  const { mutateAsync: saveDraft, isPending: saving } = useSaveDraftApi();
  const { mutateAsync: publish, isPending: publishing } = usePublishApi(onClear);
  const { mutateAsync: update, isPending: updating } = useUpdateApi(onClear);
  const cancelUpdate = useCallback(() => {
    if (!editingEntry) {
      return;
    }

    const newLoc = makeEntryPath(
      editingEntry?.category!,
      editingEntry.author,
      editingEntry.permlink
    );
    router.push(newLoc);
  }, [editingEntry, router]);

  return schedule ? (
    <div className="flex items-center justify-end p-2">
      <LoginRequired>
        <Button
          size="sm"
          icon={(posting || publishing) && <Spinner className="w-3.5 h-3.5" />}
          iconPlacement="left"
          onClick={() => {
            if (!validate()) {
              return;
            }

            doSchedule({
              title,
              tags,
              body,
              reward,
              reblogSwitch,
              beneficiaries,
              schedule,
              description
            });
          }}
          disabled={posting || publishing}
        >
          {i18next.t("submit.schedule")}
        </Button>
      </LoginRequired>
    </div>
  ) : (
    <div className="flex items-center justify-end border-b border-[--border-color] p-2">
      {editingEntry === null && (
        <>
          {isDraftEmpty ? (
            <EcencyConfigManager.Conditional
              condition={({ visionFeatures }) => visionFeatures.drafts.enabled}
            >
              <LoginRequired>
                <Button
                  size="sm"
                  outline={true}
                  className="mr-[6px]"
                  onClick={() => setDrafts(!drafts)}
                  icon={contentLoadSvg}
                  iconPlacement="left"
                >
                  {i18next.t("submit.load-draft")}
                </Button>
              </LoginRequired>
            </EcencyConfigManager.Conditional>
          ) : (
            <LoginRequired>
              <Button
                size="sm"
                outline={true}
                className="mr-[6px]"
                icon={contentSaveSvg}
                iconPlacement="left"
                onClick={() => {
                  if (!validate()) {
                    return;
                  }
                  saveDraft({
                    tags,
                    title,
                    body,
                    description,
                    selectedThumbnail,
                    selectionTouched,
                    editingDraft,
                    beneficiaries,
                    reward
                  });
                }}
                disabled={disabled || saving || posting || publishing}
              >
                {editingDraft === null
                  ? i18next.t("submit.save-draft")
                  : i18next.t("submit.update-draft")}
              </Button>
            </LoginRequired>
          )}
          <LoginRequired>
            <Button
              size="sm"
              icon={(posting || publishing) && <Spinner className="w-3.5 h-3.5" />}
              iconPlacement="left"
              onClick={() => {
                if (!validate()) {
                  return;
                }

                publish({
                  reblogSwitch,
                  title,
                  tags,
                  body,
                  description,
                  reward,
                  beneficiaries,
                  selectedThumbnail,
                  selectionTouched
                });
              }}
              disabled={disabled || posting || saving || publishing}
            >
              {i18next.t("submit.publish")}
            </Button>
          </LoginRequired>
        </>
      )}
      {activeUser && <DraftsDialog show={drafts} setShow={setDrafts} />}

      {editingEntry !== null && (
        <>
          <Button size="sm" appearance="secondary" outline={true} onClick={cancelUpdate}>
            {i18next.t("submit.cancel-update")}
          </Button>
          <LoginRequired>
            <Button
              size="sm"
              icon={(posting || publishing) && <Spinner className="w-3.5 h-3.5" />}
              iconPlacement="left"
              onClick={() => {
                if (!validate()) {
                  return;
                }

                update({
                  editingEntry,
                  tags,
                  title,
                  body,
                  description,
                  selectedThumbnail,
                  selectionTouched
                });
              }}
              disabled={posting || publishing}
            >
              {i18next.t("submit.update")}
            </Button>
          </LoginRequired>
        </>
      )}
    </div>
  );
}
