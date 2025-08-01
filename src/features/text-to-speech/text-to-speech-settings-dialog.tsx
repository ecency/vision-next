"use client";

import {getVoicesAsync, useSynchronizedLocalStorage} from "@/utils";
import { PREFIX } from "@/utils/local-storage";
import { cloneElement, ReactElement, useEffect, useState } from "react";
import { success } from "../shared";
import { Button, FormControl, Modal, ModalBody, ModalHeader } from "../ui";
import { TextToSpeechSettingsItem } from "./text-to-speech-settings-item";
import i18next from "i18next";

interface Props {
  children: ReactElement;
}

export function TextToSpeechSettingsDialog({ children }: Props) {
  const [show, setShow] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  const clonedChildren = cloneElement(children, {
    onClick: () => setShow(!show)
  });
  const [text, setText] = useState("Hello Hive, how are you?");
  const [selected, setSelected] = useState<SpeechSynthesisVoice>();

  const [savedVoiceURI, setSavedVoiceURI] = useSynchronizedLocalStorage<string>(PREFIX + "_tts_voice");

  useEffect(() => {
    if (typeof window === "undefined") return;

    getVoicesAsync().then((voices) => {
      setAvailableVoices(voices);
      const defaultVoice = voices.find((vc) => vc.default);
      const found = voices.find((vc) => vc.voiceURI === savedVoiceURI);
      setSelected(found ?? defaultVoice ?? voices[0]);
    });
  }, [savedVoiceURI]);

  return (
    <>
      <div>{clonedChildren}</div>
      <Modal centered={true} show={show} onHide={() => setShow(false)} size="lg">
        <ModalHeader closeButton={false} className="flex justify-between">
          <div>{i18next.t("tts-settings.title")}</div>

          <div className="flex gap-2">
            <Button
              appearance="success"
              size="sm"
              disabled={!selected}
              onClick={() => {
                if (!selected) {
                  return;
                }
                setSavedVoiceURI(selected?.voiceURI);
                setShow(false);
                success(i18next.t("tts-settings.voice-updated", { n: selected?.name }));
              }}
            >
              Save
            </Button>
            <Button appearance="gray" size="sm" onClick={() => setShow(false)}>
              Close
            </Button>
          </div>
        </ModalHeader>
        <ModalBody>
          <div className="mb-4 text-sm">{i18next.t("tts-settings.hint")}</div>
          <div className="mb-4">
            <div className="text-sm opacity-50 mb-2">{i18next.t("tts-settings.playground")}</div>

            <FormControl type="text" value={text} onChange={(e) => setText(e.target.value)} />
          </div>
          <div>
            <div className="text-sm opacity-50 mb-2">{i18next.t("tts-settings.voices")}</div>
            <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
              {availableVoices.map((voice) => (
                <TextToSpeechSettingsItem
                  text={text}
                  voice={voice}
                  selected={selected}
                  key={voice.voiceURI}
                  onSelect={() => setSelected(voice)}
                />
              ))}
            </div>
          </div>
        </ModalBody>
      </Modal>
    </>
  );
}
