import React, { ReactNode, useContext, useState } from "react";
import { WaveFormToolbarImagePicker } from "./wave-form-toolbar-image-picker";
import { WaveFormEmojiPicker } from "./wave-form-emoji-picker";
import { Button } from "@ui/button";
import { UilChart } from "@tooni/iconscout-unicons-react";
import { PollsContext, PollsCreation } from "@/features/polls";

interface Props {
  onAddImage: (url: string, name: string) => void;
  onEmojiPick: (value: string) => void;
  onAddVideo: (value: string) => void;
  submit?: ReactNode;
  isEdit?: boolean;
}

export const WaveFormToolbar = ({ onAddImage, onEmojiPick, submit, isEdit }: Props) => {
  const { activePoll, setActivePoll, clearActivePoll } = useContext(PollsContext);
  const [show, setShow] = useState(false);

  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex items-center">
        <WaveFormToolbarImagePicker onAddImage={onAddImage} />
        <WaveFormEmojiPicker onPick={onEmojiPick} />
        {!isEdit && (
          <Button appearance="gray-link" icon={<UilChart />} onClick={() => setShow(true)} />
        )}
        <PollsCreation
          existingPoll={activePoll}
          show={show}
          setShow={setShow}
          onAdd={setActivePoll}
          onDeletePoll={clearActivePoll}
        />
      </div>
      {submit}
    </div>
  );
};
