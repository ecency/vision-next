"use client";

import { useEffect, useRef, useState } from "react";
import i18next from "i18next";
import { ShortVideo } from "@ecency/sdk";
import { UilVolume, UilVolumeMute } from "@tooni/iconscout-unicons-react";

type Fit = "cover" | "contain";

// Resolve a 3Speak video's HLS stream (manifest.m3u8) from its embed API. The
// feed only carries the embed *iframe* URL; the reels player streams the
// manifest straight into a <video> so it can fill the reel via object-fit
// instead of being letterboxed inside an opaque iframe. Returns the primary URL
// plus CDN fallbacks, or null when it can't be resolved.
async function resolveThreeSpeakHls(
  author: string,
  permlink: string,
  signal: AbortSignal
): Promise<string | null> {
  try {
    const res = await fetch(
      `https://play.3speak.tv/api/embed?v=${encodeURIComponent(author)}/${encodeURIComponent(
        permlink
      )}`,
      { signal }
    );
    if (!res.ok) {
      return null;
    }
    const data = await res.json();
    const url = [data?.videoUrl, data?.videoUrlFallback1, data?.videoUrlFallback2].find(
      (u: unknown): u is string => typeof u === "string" && u.length > 0
    );
    return url ?? null;
  } catch {
    return null;
  }
}

interface Props {
  video: ShortVideo;
  caption: string;
}

/**
 * Native HLS reel player. Mounted only for the active reel, it streams the
 * 3Speak manifest into a muted-autoplay <video> and fits it aspect-aware:
 * portrait/square clips fill the reel (cover) while landscape clips are
 * letterboxed (contain) so nothing is cropped. hls.js is dynamically imported
 * so it never ships in any other page's bundle; Safari plays HLS natively. If
 * the stream can't be resolved or played, it falls back to the 3Speak iframe.
 */
export function ReelVideo({ video, caption }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [fit, setFit] = useState<Fit>("contain");
  const [muted, setMuted] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) {
      return;
    }

    const ac = new AbortController();
    let cancelled = false;
    let hls: { destroy: () => void } | null = null;

    (async () => {
      const src = await resolveThreeSpeakHls(video.author, video.permlink, ac.signal);
      if (cancelled) {
        return;
      }
      if (!src) {
        setFailed(true);
        return;
      }

      // Safari/iOS play HLS natively; every other browser needs hls.js, loaded
      // on demand so it stays out of the shared bundle.
      if (el.canPlayType("application/vnd.apple.mpegurl")) {
        el.src = src;
      } else {
        try {
          const { default: Hls } = await import("hls.js");
          if (cancelled) {
            return;
          }
          if (Hls.isSupported()) {
            const instance = new Hls({ maxBufferLength: 30 });
            hls = instance;
            instance.loadSource(src);
            instance.attachMedia(el);
            instance.on(Hls.Events.ERROR, (_event, data) => {
              if (data.fatal) {
                setFailed(true);
              }
            });
          } else {
            el.src = src;
          }
        } catch {
          setFailed(true);
          return;
        }
      }

      el.muted = true;
      // Autoplay may still be rejected by the browser; the poster stays visible.
      el.play().catch(() => undefined);
    })();

    return () => {
      cancelled = true;
      ac.abort();
      if (hls) {
        hls.destroy();
      }
      el.removeAttribute("src");
      el.load();
    };
  }, [video.author, video.permlink]);

  const onLoadedMetadata = () => {
    const el = videoRef.current;
    if (el?.videoWidth && el.videoHeight) {
      setFit(el.videoHeight >= el.videoWidth ? "cover" : "contain");
    }
  };

  const toggleMuted = () => {
    const el = videoRef.current;
    if (!el) {
      return;
    }
    el.muted = !el.muted;
    setMuted(el.muted);
  };

  if (failed) {
    return (
      <iframe
        title={`${video.author}/${video.permlink}`}
        src={`https://play.3speak.tv/watch?v=${encodeURIComponent(video.author)}/${encodeURIComponent(
          video.permlink
        )}&mode=iframe&autoplay=true`}
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="h-full w-full border-0"
      />
    );
  }

  return (
    <>
      <video
        ref={videoRef}
        poster={video.thumbnail_url ?? undefined}
        muted={muted}
        playsInline
        loop
        preload="metadata"
        onLoadedMetadata={onLoadedMetadata}
        // Native-playback failures (Safari/iOS, or the non-hls.js src= path) only
        // surface as a <video> error event — fall back to the iframe like the
        // hls.js fatal-error path does.
        onError={() => setFailed(true)}
        aria-label={caption}
        className="h-full w-full bg-black"
        style={{ objectFit: fit }}
      />
      <button
        type="button"
        onClick={toggleMuted}
        aria-label={
          muted
            ? i18next.t("g.unmute", { defaultValue: "Unmute" })
            : i18next.t("g.mute", { defaultValue: "Mute" })
        }
        className="absolute right-2 top-2 rounded-full bg-black/40 p-2 text-white backdrop-blur-sm"
      >
        {muted ? <UilVolumeMute className="size-5" /> : <UilVolume className="size-5" />}
      </button>
    </>
  );
}
