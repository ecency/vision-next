import React, { useEffect, useState } from "react";
import { getTranslation, getLanguages, Language } from "@/api/translation";
import i18next from "i18next";
import { Modal, ModalBody, ModalHeader } from "@ui/modal";
import { Spinner } from "@ui/spinner";
import { Select } from "@ui/input/form-controls/select";

interface Props {
  messageText: string;
  onHide: () => void;
}

export function MessageTranslate({ messageText, onHide }: Props) {
  const [translated, setTranslated] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [target, setTarget] = useState<string>(
    i18next.language.split("-")[0]
  );

  useEffect(() => {
    getLanguages().then(setLanguages);
  }, []);

  useEffect(() => {
    let canceled = false;
    setLoading(true);
    setTranslated("");
    getTranslation(messageText, "auto", target)
      .then((r) => {
        if (!canceled) {
          setTranslated(r.translatedText);
        }
      })
      .finally(() => {
        if (!canceled) {
          setLoading(false);
        }
      });
    return () => {
      canceled = true;
    };
  }, [messageText, target]);

  return (
    <Modal
      show={true}
      onHide={onHide}
      className="flex justify-center items-center pt-0"
      dialogClassName="mt-0 rounded-xl"
    >
      <ModalHeader closeButton={true}>{i18next.t("chat.translate")}</ModalHeader>
      <ModalBody className="pb-12 min-h-[200px]">
        <div className="mb-3">
          <label className="block text-sm mb-1">
            {i18next.t("chat.translate-target-language")}
          </label>
          <Select
            type={"select"}
            value={target}
            size="sm"
            onChange={(e) => setTarget(e.currentTarget.value)}
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </Select>
        </div>
        {loading ? (
          <div className="flex justify-center p-3">
            <Spinner className="w-4 h-4" />
          </div>
        ) : (
          <p className="whitespace-pre-line text-sm">{translated}</p>
        )}
      </ModalBody>
    </Modal>
  );
}
