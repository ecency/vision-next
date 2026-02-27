import React, { ReactNode, useContext, useState } from "react";
import { WaveFormToolbarImagePicker } from "./wave-form-toolbar-image-picker";
import { WaveFormEmojiPicker } from "./wave-form-emoji-picker";
import { Button } from "@ui/button";
import { UilChart } from "@tooni/iconscout-unicons-react";
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
  submit?: ReactNode;
  isEdit?: boolean;
  disabled?: boolean;
}

export const WaveFormToolbar = ({ onAddImage, onEmojiPick, submit, isEdit, disabled }: Props) => {
  const { activePoll, setActivePoll, clearActivePoll } = useContext(PollsContext);
  const [show, setShow] = useState(false);
  const [showAiGenerator, setShowAiGenerator] = useState(false);

  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex items-center">
        <WaveFormToolbarImagePicker onAddImage={onAddImage} disabled={disabled} />
        <WaveFormEmojiPicker onPick={onEmojiPick} disabled={disabled} />
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
            onClick={() => setShowAiGenerator(true)}
            disabled={disabled}
          >
            {i18next.t("ai-image-generator.toolbar-button")}
          </Button>
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
          onInsert={(url) => {
            onAddImage(url, "ai-generated");
            setShowAiGenerator(false);
          }}
        />
      )}
    </div>
  );
};
