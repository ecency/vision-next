import React, { useEffect, useState } from "react";
import { Entry } from "@/entities";
import { getTranslation, getLanguages, Language } from "@/api/translation";
import { postBodySummary } from "@ecency/render-helper";
import i18next from "i18next";
import { Modal, ModalBody, ModalHeader } from "@ui/modal";
import { Spinner } from "@ui/spinner";
import { Select } from "@ui/input/form-controls/select";
import { isRtlLang, languageDisplayName, normLang } from "./iso639";

interface Props {
  entry: Entry;
  onHide: () => void;
  // Pre-select the target language (e.g. from the inline banner's "Change
  // language" action or a feed/wave chip). Defaults to the UI language.
  initialTarget?: string;
  // Source language for the request. Defaults to "auto" (LibreTranslate detects).
  initialSource?: string;
}

export function EntryTranslate({ entry, onHide, initialTarget, initialSource }: Props) {
  const [translated, setTranslated] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [detectedFrom, setDetectedFrom] = useState<string>("");
  const [error, setError] = useState(false);
  const [target, setTarget] = useState<string>(
    normLang(initialTarget || i18next.language) || "en"
  );

  useEffect(() => {
    getLanguages().then(setLanguages);
  }, []);

  useEffect(() => {
    let canceled = false;
    setLoading(true);
    setTranslated("");
    setDetectedFrom("");
    setError(false);
    const body = postBodySummary(entry.body);
    getTranslation(body, initialSource ?? "auto", target)
      .then((r) => {
        if (!canceled) {
          setTranslated(r.translatedText);
          if (r.detectedLanguage?.language) {
            setDetectedFrom(r.detectedLanguage.language);
          }
        }
      })
      .catch(() => {
        // Surface the failure instead of leaving the modal blank (and swallow
        // the rejection so it isn't unhandled).
        if (!canceled) {
          setError(true);
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
  }, [entry, target, initialSource]);

  return (
    <Modal
      show={true}
      onHide={onHide}
      className="flex justify-center items-center pt-0"
      dialogClassName="mt-0 rounded-xl"
    >
      <ModalHeader closeButton={true}>{i18next.t("entry-menu.translate")}</ModalHeader>
      <ModalBody className="pb-12 min-h-[200px]">
        <div className="mb-3">
          <label className="block text-sm mb-1">
            {i18next.t("entry-translate.target-language")}
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
        ) : error ? (
          <p className="text-sm text-red-500">{i18next.t("entry-translate.error")}</p>
        ) : (
          <>
            {detectedFrom && (
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                {i18next.t("entry-translate.translated-from", {
                  lang: languageDisplayName(detectedFrom, i18next.language)
                })}
              </div>
            )}
            <p className="whitespace-pre-line text-sm" dir={isRtlLang(target) ? "rtl" : "ltr"}>
              {translated}
            </p>
          </>
        )}
      </ModalBody>
    </Modal>
  );
}
