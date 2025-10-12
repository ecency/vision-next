import React, { HTMLProps, useRef } from "react";
import { renderPostBody } from "@ecency/render-helper";
import { clsx } from "clsx";
import {
  AuthorLinkExtension,
  HiveOperationExtension,
  HivePostLinkExtension,
  ImageZoomExtension,
  TagLinkExtension,
  WaveLikePostExtension,
  YoutubeVideoExtension,
} from "./extensions";
import { ThreeSpeakVideoExtension } from "./extensions/three-speak-video-extension";
import { TwitterExtension } from "./extensions/twitter-extension";

interface Props {
  value: string;
  pure?: boolean;
  onHiveOperationClick?: (op: string) => void;
  TwitterComponent?: any;
}

export function EcencyRenderer({
  value,
  pure = false,
  onHiveOperationClick,
  TwitterComponent = () => <div>No twitter component</div>,
  ...other
}: HTMLProps<HTMLDivElement> & Props) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <>
      <div
        {...other}
        ref={ref}
        itemProp="articleBody"
        className={clsx(
          "entry-body markdown-view user-selectable",
          pure ? "markdown-view-pure" : "",
          other.className
        )}
        dangerouslySetInnerHTML={{ __html: renderPostBody(value, false) }}
      />
      {!pure && (
        <>
          <ImageZoomExtension containerRef={ref} />
          <HivePostLinkExtension containerRef={ref} />
          <AuthorLinkExtension containerRef={ref} />
          <TagLinkExtension containerRef={ref} />
          <YoutubeVideoExtension containerRef={ref} />
          <ThreeSpeakVideoExtension containerRef={ref} />
          <WaveLikePostExtension containerRef={ref} />
          <TwitterExtension
            containerRef={ref}
            ComponentInstance={TwitterComponent}
          />
          <HiveOperationExtension
            containerRef={ref}
            onClick={onHiveOperationClick}
          />
        </>
      )}
    </>
  );
}
