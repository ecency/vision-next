import React, { ReactNode, useContext, useState } from "react";
import { WaveFormToolbarImagePicker } from "./wave-form-toolbar-image-picker";
import { WaveFormEmojiPicker } from "./wave-form-emoji-picker";
import { Button } from "@ui/button";
import { UilChart, UilVideo } from "@tooni/iconscout-unicons-react";
import { AiImageIcon } from "@/features/shared/ai-image-icon";
import { PollsContext, PollsCreation } from "@/features/polls";
import { EcencyConfigManager } from "@/config";
import i18next from "i18next";
import dynamic from "next/dynamic";

const AiImageGeneratorDialog = dynamic(
  () => import("@/features/shared/ai-image-generator").then((m) => ({
    default: m.AiImageGeneratorDialog
  })),
  { ssr: false }
);

interface Props {
  onAddImage: (url: string, name: string) => void;
  onEmojiPick: (value: string) => void;
  onAddVideo: (value: string) => void;
  onShowVideoUpload?: () => void;
  hasVideo?: boolean;
  submit?: ReactNode;
  isEdit?: boolean;
  disabled?: boolean;
  suggestedPrompt?: string;
}

export const WaveFormToolbar = ({
  onAddImage,
  onEmojiPick,
  onShowVideoUpload,
  hasVideo,
  submit,
  isEdit,
  disabled,
  suggestedPrompt
}: Props) => {
  const { activePoll, setActivePoll, clearActivePoll } = useContext(PollsContext);
  const [show, setShow] = useState(false);
  const [showAiGenerator, setShowAiGenerator] = useState(false);

  return (
    <div className="flex items-center justify-between py-1.5 border-t border-[--border-color]">
      <div className="flex items-center">
        <WaveFormToolbarImagePicker onAddImage={onAddImage} disabled={disabled} />
        <WaveFormEmojiPicker onPick={onEmojiPick} disabled={disabled} />
        <EcencyConfigManager.Conditional
          condition={({ thirdPartyFeatures }) => thirdPartyFeatures.threeSpeak.uploading.enabled}
        >
          <Button
            appearance="gray-link"
            icon={<UilVideo />}
            onClick={onShowVideoUpload}
            disabled={disabled || hasVideo || !onShowVideoUpload}
            title={i18next.t("video-upload.title-short")}
          />
        </EcencyConfigManager.Conditional>
        {!isEdit && (
          <Button
            appearance="gray-link"
            icon={<UilChart />}
            onClick={() => setShow(true)}
            disabled={disabled}
          />
        )}
        <EcencyConfigManager.Conditional
          condition={({ visionFeatures }) => visionFeatures.aiImageGenerator.enabled}
        >
          <Button
            appearance="gray-link"
            icon={<AiImageIcon />}
            onClick={() => setShowAiGenerator(true)}
            disabled={disabled}
          />
        </EcencyConfigManager.Conditional>
        <PollsCreation
          existingPoll={activePoll}
          show={show}
          setShow={setShow}
          onAdd={setActivePoll}
          onDeletePoll={clearActivePoll}
        />
      </div>
      {submit}
      {showAiGenerator && (
        <AiImageGeneratorDialog
          show={showAiGenerator}
          setShow={setShowAiGenerator}
          suggestedPrompt={suggestedPrompt}
          onInsert={(url) => {
            onAddImage(url, "ai-generated");
            setShowAiGenerator(false);
          }}
        />
      )}
    </div>
  );
};
