import React, { useContext, useState } from "react";
import i18next from "i18next";
import { DeckThreadsFormToolbarImagePicker } from "./deck-threads-form-toolbar-image-picker";
import { DeckThreadsFormEmojiPicker } from "./deck-threads-form-emoji-picker";
import { Button } from "@ui/button";
import { UilChart } from "@tooni/iconscout-unicons-react";
import { PollsContext, PollsCreation } from "@/features/polls";

interface Props {
  onAddImage: (url: string, name: string) => void;
  onEmojiPick: (value: string) => void;
  onAddVideo: (value: string) => void;
}

export const DeckThreadsFormToolbar = ({ onAddImage, onEmojiPick, onAddVideo }: Props) => {
  const { activePoll, setActivePoll, clearActivePoll } = useContext(PollsContext);
  const [show, setShow] = useState(false);

  return (
    <div className="deck-threads-form-toolbar">
      <DeckThreadsFormToolbarImagePicker onAddImage={onAddImage} />
      <DeckThreadsFormEmojiPicker onPick={onEmojiPick} />
      <Button appearance="gray-link" icon={<UilChart />} onClick={() => setShow(true)} aria-label={i18next.t("polls.add-poll", { defaultValue: "Add poll" })} />
      <PollsCreation
        existingPoll={activePoll}
        show={show}
        setShow={setShow}
        onAdd={setActivePoll}
        onDeletePoll={clearActivePoll}
      />
    </div>
  );
};
