import React, { ReactNode, useContext, useState } from "react";
import { WaveFormToolbarImagePicker } from "./wave-form-toolbar-image-picker";
import { WaveFormEmojiPicker } from "./wave-form-emoji-picker";
import { Button } from "@ui/button";
import { UilChart, UilImageShare, UilVideo } from "@tooni/iconscout-unicons-react";
import { AiImageIcon } from "@/features/shared/ai-image-icon";
import { LoginRequired } from "@/features/shared";
import { PollsContext, PollsCreation } from "@/features/polls";
import { EcencyConfigManager } from "@/config";
import { BeneficiaryRoute } from "@/entities";
import i18next from "i18next";
import dynamic from "next/dynamic";

const AiImageGeneratorDialog = dynamic(
  () => import("@/features/shared/ai-image-generator").then((m) => ({
    default: m.AiImageGeneratorDialog
  })),
  { ssr: false }
);

// Code-split: the meme maker (iframe + postMessage) only loads on click.
const MemeMakerDialog = dynamic(
  () => import("@/features/decentmemes").then((m) => ({
    default: m.MemeMakerDialog
  })),
  { ssr: false }
);

interface Props {
  onAddImage: (url: string, name: string) => void;
  onAddMeme?: (data: {
    url: string;
    name: string;
    templateId: string;
    beneficiaries: BeneficiaryRoute[];
  }) => void;
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
  onAddMeme,
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
  const [showMemeMaker, setShowMemeMaker] = useState(false);

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
            aria-label={i18next.t("polls.add-poll", { defaultValue: "Add poll" })}
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
            aria-label={i18next.t("ai-image-generator.toolbar-button")}
          />
        </EcencyConfigManager.Conditional>
        <EcencyConfigManager.Conditional
          condition={({ visionFeatures }) => visionFeatures.decentMemes.enabled}
        >
          <LoginRequired>
            <Button
              appearance="gray-link"
              icon={<UilImageShare />}
              onClick={() => setShowMemeMaker(true)}
              disabled={disabled}
              aria-label={i18next.t("decentmemes.toolbar-button")}
              title={i18next.t("decentmemes.toolbar-button")}
            />
          </LoginRequired>
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
      {showMemeMaker && (
        <MemeMakerDialog
          show={showMemeMaker}
          setShow={setShowMemeMaker}
          onMemeCreated={({ url, alt, templateId, beneficiaries }) => {
            onAddMeme?.({ url, name: alt, templateId, beneficiaries });
            setShowMemeMaker(false);
          }}
        />
      )}
    </div>
  );
};
