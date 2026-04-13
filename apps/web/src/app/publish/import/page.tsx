"use client";

import { fetchImport } from "@/app/publish/_components/publish-import-dialog";
import { usePublishState } from "@/app/publish/_hooks";
import { Button, FormControl } from "@/features/ui";
import { Spinner } from "@ui/spinner";
import i18next from "i18next";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

export default function PublishImportPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const { setTitle, setContent, setTags, setSelectedThumbnail } = usePublishState();
  const router = useRouter();

  const handleImport = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const data = await fetchImport(url);

      setTitle(data.title);
      setContent(data.content);
      setSelectedThumbnail(data.thumbnail || "");
      setTags(data.tags ?? []);

      router.push("/publish");
    } catch (e: unknown) {
      setErrorMessage(e instanceof Error ? e.message : i18next.t("publish.import-failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-[600px] mx-auto px-4 pt-16 md:pt-24">
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-semibold mb-3">{i18next.t("publish.import-title")}</h1>
        <p className="text-gray-600 dark:text-gray-400">
          {i18next.t("publish.import-subtitle")}
        </p>
      </div>
      <div className="bg-white dark:bg-dark-200 rounded-2xl p-6 md:p-8 shadow-sm">
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
          <p className="text-sm text-red-500 mt-3">{errorMessage}</p>
        )}
        <div className="flex justify-end gap-3 mt-6">
          <Button size="sm" appearance="gray" onClick={() => router.push("/publish")} disabled={loading}>
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
        </div>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-500 text-center mt-4">
        {i18next.t("publish.import-ownership-notice")}
      </p>
    </div>
  );
}
