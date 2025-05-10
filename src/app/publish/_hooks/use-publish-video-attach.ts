import { ThreeSpeakVideo } from "@ecency/sdk";
import { Editor } from "@tiptap/core";
import { useCallback, useEffect } from "react";
import { usePublishState } from "./use-publish-state";

export function usePublishVideoAttach(editor: Editor) {
  const { setPublishingVideo, clearPublishingVideo } = usePublishState();

  // Whenever editor content is changing need to check if any videos has attached but removed from content
  // In this case it should clear video state explicitly
  useEffect(() => {
    editor?.on("update", (e) => {
      const videos = editor.$nodes("threeSpeakVideo");
      const hasNoPublishingVideos = videos?.every((v) => v.attributes.status !== "publish_manual");

      if (hasNoPublishingVideos) {
        clearPublishingVideo();
      }
    });
  }, [editor]);

  return useCallback(
    (video: ThreeSpeakVideo, isNsfw: boolean) => {
      if (video.status === "publish_manual") {
        setPublishingVideo(video);
      } else if (video.status === "published") {
        clearPublishingVideo();
      }

      editor
        .chain()
        .set3SpeakVideo({
          src: `https://3speak.tv/watch?v=${video.owner}/${video.permlink}`,
          thumbnail: `https://ipfs-3speak.b-cdn.net/ipfs/${video.thumbUrl}`,
          status: video.status
        })
        .run();
    },
    [editor]
  );
}
