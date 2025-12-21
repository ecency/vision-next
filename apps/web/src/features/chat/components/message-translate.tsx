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
  const [error, setError] = useState<string>("");
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loadingLanguages, setLoadingLanguages] = useState(true);
  const [target, setTarget] = useState<string>(
    i18next.language.split("-")[0]
  );

  useEffect(() => {
    getLanguages()
      .then(setLanguages)
      .catch(() => {
        setError("Failed to load languages");
      })
      .finally(() => {
        setLoadingLanguages(false);
      });
  }, []);

  useEffect(() => {
    let canceled = false;
    setLoading(true);
    setTranslated("");
    setError("");
    getTranslation(messageText, "auto", target)
      .then((r) => {
        if (!canceled) {
          setTranslated(r.translatedText);
        }
      })
      .catch((err) => {
        if (!canceled) {
          setError(err?.message || "Translation failed. Please try again.");
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
            disabled={loadingLanguages || languages.length === 0}
          >
            {loadingLanguages ? (
              <option>Loading languages...</option>
            ) : languages.length === 0 ? (
              <option>No languages available</option>
            ) : (
              languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))
            )}
          </Select>
        </div>
        {error ? (
          <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded">
            {error}
          </div>
        ) : loading ? (
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
