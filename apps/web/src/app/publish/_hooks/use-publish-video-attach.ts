import { ThreeSpeakVideo } from "@ecency/sdk";
import { Editor } from "@tiptap/core";
import { useCallback, useEffect } from "react";
import { usePublishState } from "./use-publish-state";

export function usePublishVideoAttach(editor: Editor | null) {
  const { setPublishingVideo, clearPublishingVideo } = usePublishState();

  // Whenever editor content is changing need to check if any videos has attached but removed from content
  // In this case it should clear video state explicitly
  useEffect(() => {
    if (!editor) {
      return;
    }

    const handler = () => {
      const videos = editor.$nodes("threeSpeakVideo");
      const hasNoPublishingVideos =
        videos?.every((v) => v.attributes.status !== "publish_manual") ?? true;

      if (hasNoPublishingVideos) {
        clearPublishingVideo();
      }
    };

    editor.on("update", handler);

    return () => {
      editor.off("update", handler);
    };
  }, [editor, clearPublishingVideo]);

  return useCallback(
    (video: ThreeSpeakVideo, isNsfw: boolean) => {
      if (!editor) {
        return;
      }

      if (video.status === "publish_manual") {
        setPublishingVideo(video);
      } else if (video.status === "published") {
        clearPublishingVideo();
      }

      editor
        .chain()
        .setTextAlign("left")
        .set3SpeakVideo({
          src: `https://3speak.tv/watch?v=${video.owner}/${video.permlink}`,
          thumbnail: `https://ipfs-3speak.b-cdn.net/ipfs/${video.thumbUrl}`,
          status: video.status
        })
        .run();
    },
    [editor, clearPublishingVideo, setPublishingVideo]
  );
}
