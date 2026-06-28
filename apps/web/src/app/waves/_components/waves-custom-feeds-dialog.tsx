"use client";

import React, { useMemo, useState } from "react";
import i18next from "i18next";
import { useQuery } from "@tanstack/react-query";
import { getWavesTrendingTagsQueryOptions } from "@ecency/sdk";
import { Modal, ModalBody, ModalHeader } from "@ui/modal";
import { Button } from "@ui/button";
import { UilMultiply, UilPlus } from "@tooni/iconscout-unicons-react";
import { useWavesCustomFeeds, normalizeWaveTag } from "@/app/waves/_hooks";

const TRENDING_LIMIT = 24;
const TRENDING_HOURS = 24;

interface Props {
  show: boolean;
  onHide: () => void;
  // Switch to the tag's feed right after adding it from here.
  onSelectTag?: (tag: string) => void;
}

/**
 * Add/manage custom waves feeds (pinned tags). Mirrors the mobile waves tag
 * picker: type a tag to add, see your pinned feeds (tap to remove), and pick from
 * trending tags. Persistence is browser-local via {@link useWavesCustomFeeds}.
 */
export function WavesCustomFeedsDialog({ show, onHide, onSelectTag }: Props) {
  const { tags, addTag, removeTag } = useWavesCustomFeeds();
  const [input, setInput] = useState("");

  // Combined trending tags across all containers; only fetched while open.
  const { data } = useQuery({
    ...getWavesTrendingTagsQueryOptions(undefined, TRENDING_HOURS),
    enabled: show
  });

  const trendingTags = useMemo(
    () =>
      (Array.isArray(data) ? data : [])
        .map((t) => normalizeWaveTag(t.tag))
        .filter((t) => t && !tags.includes(t))
        .slice(0, TRENDING_LIMIT),
    [data, tags]
  );

  const candidate = normalizeWaveTag(input);
  const canAdd = !!candidate && !tags.includes(candidate);

  const submit = () => {
    if (!canAdd) {
      return;
    }
    addTag(candidate);
    onSelectTag?.(candidate);
    setInput("");
  };

  return (
    <Modal show={show} centered={true} onHide={onHide} className="waves-custom-feeds-dialog">
      <ModalHeader thin={true} closeButton={true} />
      <ModalBody>
        <div className="flex flex-col gap-4 pb-4">
          <div className="flex flex-col gap-1">
            <div className="text-lg font-semibold">{i18next.t("waves.custom-feeds-title")}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {i18next.t("waves.custom-feeds-subtitle")}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center flex-1 rounded-full border border-[--border-color] px-3">
              <span className="text-gray-500">#</span>
              <input
                className="flex-1 bg-transparent py-2 px-1 outline-none text-sm"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    submit();
                  }
                }}
                placeholder={i18next.t("waves.add-tag-placeholder")}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                aria-label={i18next.t("waves.add-tag-placeholder")}
              />
            </div>
            <Button size="sm" disabled={!canAdd} onClick={submit} icon={<UilPlus />}>
              {i18next.t("g.add")}
            </Button>
          </div>

          {tags.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="text-xs font-semibold uppercase text-gray-500">
                {i18next.t("waves.your-feeds")}
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => removeTag(tag)}
                    aria-label={`#${tag}`}
                    className="inline-flex items-center gap-1 rounded-full bg-blue-dark-sky text-white text-sm px-3 py-1 hover:opacity-80 transition-opacity cursor-pointer"
                  >
                    <span>#{tag}</span>
                    <UilMultiply className="w-3.5 h-3.5" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {trendingTags.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="text-xs font-semibold uppercase text-gray-500">
                {i18next.t("waves.trending-tags")}
              </div>
              <div className="flex flex-wrap gap-2">
                {trendingTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => addTag(tag)}
                    aria-label={`#${tag}`}
                    className="inline-flex items-center gap-1 rounded-full bg-gray-200 dark:bg-dark-300 text-sm px-3 py-1 hover:opacity-80 transition-opacity cursor-pointer"
                  >
                    <UilPlus className="w-3.5 h-3.5" />
                    <span>#{tag}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </ModalBody>
    </Modal>
  );
}
