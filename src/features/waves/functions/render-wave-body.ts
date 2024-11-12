import { MutableRefObject, useCallback } from "react";
import {
  renderAuthors,
  renderCurrencies,
  renderExternalLinks,
  renderImages,
  renderPostLinks,
  renderTags,
  renderTweets,
  renderVideos
} from "@/features/waves";
import { Entry } from "@/entities";

interface Options {
  setCurrentViewingImageRect?: (rect: DOMRect) => void;
  setCurrentViewingImage?: (value: string) => void;
  setRenderInitiated?: (value: boolean) => void;
}

export function useRenderWaveBody(
  renderAreaRef: MutableRefObject<HTMLElement | null>,
  entry: Entry,
  { setCurrentViewingImageRect, setCurrentViewingImage, setRenderInitiated }: Options
) {
  return useCallback(async () => {
    setRenderInitiated?.(true);

    if (renderAreaRef.current) {
      renderAreaRef.current.innerHTML = await renderCurrencies(renderAreaRef?.current?.innerHTML);
    }

    if (entry.parent_author === "liketu.moments") {
      return;
    }

    renderTags(renderAreaRef);
    renderAuthors(renderAreaRef);
    renderPostLinks(renderAreaRef);
    renderExternalLinks(renderAreaRef);
    renderImages(renderAreaRef, {
      setCurrentViewingImageRect,
      setCurrentViewingImage
    });
    renderVideos(renderAreaRef);
    renderTweets(renderAreaRef);
  }, [
    entry.parent_author,
    renderAreaRef,
    setCurrentViewingImage,
    setCurrentViewingImageRect,
    setRenderInitiated
  ]);
}
