"use client";

import { Button, FormControl, Modal, ModalBody, ModalFooter, ModalHeader } from "@/features/ui";
import { Spinner } from "@ui/spinner";
import i18next from "i18next";
import { useState } from "react";

export interface ImportResult {
  title: string;
  content: string;
  thumbnail: string;
  tags: string[];
  source: "hive" | "external";
}

export async function fetchImport(url: string): Promise<ImportResult> {
  const response = await fetch("/api/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: url.trim() })
  });

  const data = await response.json();

  if (!response.ok) {
    const key = data.error ? `publish.${data.error}` : "publish.import-failed";
    throw new Error(i18next.t(key, { defaultValue: i18next.t("publish.import-failed") }));
  }

  return data;
}

interface Props {
  show: boolean;
  setShow: (show: boolean) => void;
  onImport: (result: ImportResult) => void;
}

export function PublishImportDialog({ show, setShow, onImport }: Props) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleImport = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const data = await fetchImport(url);
      onImport(data);
      handleClose();
    } catch (e: unknown) {
      setErrorMessage(e instanceof Error ? e.message : i18next.t("publish.import-failed"));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setShow(false);
    setUrl("");
    setErrorMessage("");
    setLoading(false);
  };

  return (
    <Modal show={show} onHide={handleClose} centered={true}>
      <ModalHeader closeButton={true}>{i18next.t("publish.import-title")}</ModalHeader>
      <ModalBody>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {i18next.t("publish.import-hint")}
        </p>
        <FormControl
          type="text"
          value={url}
          placeholder="https://..."
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setUrl(e.target.value);
            setErrorMessage("");
          }}
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === "Enter" && url.trim() && !loading) {
              handleImport();
            }
          }}
          disabled={loading}
        />
        {errorMessage && (
          <p className="text-sm text-red-500 mt-2">{errorMessage}</p>
        )}
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-4">
          {i18next.t("publish.import-ownership-notice")}
        </p>
      </ModalBody>
      <ModalFooter className="flex justify-end gap-2">
        <Button size="sm" appearance="gray" onClick={handleClose} disabled={loading}>
          {i18next.t("g.cancel")}
        </Button>
        <Button size="sm" disabled={!url.trim() || loading} onClick={handleImport}>
          {loading ? (
            <span className="flex items-center gap-2">
              <Spinner className="w-3 h-3" />
              {i18next.t("publish.importing")}
            </span>
          ) : (
            i18next.t("g.import")
          )}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
