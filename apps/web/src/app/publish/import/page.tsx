"use client";

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
      const response = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.error || i18next.t("publish.import-failed"));
        return;
      }

      setTitle(data.title);
      setContent(data.content);
      if (data.thumbnail) {
        setSelectedThumbnail(data.thumbnail);
      }
      if (data.tags?.length > 0) {
        setTags(data.tags);
      }

      router.push("/publish");
    } catch {
      setErrorMessage(i18next.t("publish.import-failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-[600px] mx-auto px-4 pt-8 md:pt-12">
      <div className="bg-white dark:bg-dark-200 rounded-2xl p-6 md:p-8 shadow-sm">
        <h1 className="text-xl font-semibold mb-6">{i18next.t("publish.import-title")}</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
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
    </div>
  );
}
