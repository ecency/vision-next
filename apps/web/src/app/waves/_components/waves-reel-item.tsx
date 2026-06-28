"use client";

import { useEffect, useRef, useState } from "react";
import i18next from "i18next";
import { ShortsFeedEntry } from "@ecency/sdk";
import { EntryVoteBtn, EntryTipBtn, UserAvatar, ProfileLink } from "@/features/shared";
import { Button } from "@ui/button";
import { UilComment, UilPlay } from "@tooni/iconscout-unicons-react";

interface Props {
  item: ShortsFeedEntry;
  onReply: (item: ShortsFeedEntry) => void;
}

// The reel already plays the video, so the caption is just the human text:
// drop markdown images, turn markdown links into their label, and strip bare
// URLs (e.g. the play.3speak.tv embed link the body carries).
function buildReelCaption(item: ShortsFeedEntry): string {
  const raw = item.title?.trim() || item.body?.trim() || "";
  return raw
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 140);
}

/**
 * One full-height reel: the 3Speak video plays only while the item is the one in
 * view (mounting every iframe at once would autoplay/load dozens of videos), with
 * the same vote/reply/tip engagement as a wave card overlaid on top.
 */
export function WavesReelItem({ item, onReply }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const video = item.video;

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      return;
    }
    // Default (viewport) root accounts for clipping by the snap scroll-container,
    // so only the reel actually shown reports a high ratio.
    const observer = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting && entry.intersectionRatio >= 0.6),
      { threshold: [0, 0.6, 1] }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const caption = buildReelCaption(item);

  return (
    <div
      ref={ref}
      className="relative h-full w-full shrink-0 snap-start rounded-2xl bg-black"
    >
      {/* Video / poster — only this layer clips, so the vote slider (rendered by
          EntryVoteBtn in the rail below) isn't cut off by the reel bounds. */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-2xl">
        {active && video ? (
          <iframe
            title={`${item.author}/${item.permlink}`}
            src={`https://play.3speak.tv/watch?v=${encodeURIComponent(video.author)}/${encodeURIComponent(video.permlink)}&mode=iframe&autoplay=true`}
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="h-full w-full border-0"
          />
        ) : (
          <button
            type="button"
            onClick={() => setActive(true)}
            className="group relative h-full w-full"
            aria-label={i18next.t("g.play", { defaultValue: "Play" })}
          >
            {video?.thumbnail_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={video.thumbnail_url}
                alt={caption}
                className="h-full w-full object-cover opacity-90"
                loading="lazy"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-b from-gray-800 to-black" />
            )}
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="rounded-full bg-black/50 p-4 text-white transition-transform group-hover:scale-110">
                <UilPlay className="h-8 w-8" />
              </span>
            </span>
          </button>
        )}
      </div>

      {/* Author + caption (bottom-left) */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 pr-16">
        <div className="pointer-events-auto flex items-center gap-2">
          <ProfileLink username={item.author}>
            <UserAvatar username={item.author} size="medium" />
          </ProfileLink>
          <ProfileLink username={item.author}>
            <span className="font-semibold text-white">@{item.author}</span>
          </ProfileLink>
        </div>
        {caption && <div className="mt-2 line-clamp-2 text-sm text-white/90">{caption}</div>}
      </div>

      {/* Engagement rail (bottom-right) */}
      <div className="absolute bottom-4 right-2 flex flex-col items-center gap-3 text-white">
        <EntryVoteBtn entry={item} isPostSlider={false} />
        <button
          type="button"
          onClick={() => onReply(item)}
          className="flex flex-col items-center text-xs"
          aria-label={i18next.t("g.comment", { defaultValue: "Comment" })}
        >
          <UilComment className="h-6 w-6" />
          <span>{item.children ?? 0}</span>
        </button>
        <EntryTipBtn entry={item} />
      </div>
    </div>
  );
}
