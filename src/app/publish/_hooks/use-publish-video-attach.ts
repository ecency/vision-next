import { ThreeSpeakVideo } from "@ecency/sdk";
import { Editor } from "@tiptap/core";
import { useCallback } from "react";
import { usePublishState } from "./use-publish-state";

export function usePublishVideoAttach(editor: Editor) {
  const { setPublishingVideo, clearPublishingVideo } = usePublishState();

  return useCallback(
    (video: ThreeSpeakVideo, isNsfw: boolean) => {
      const attachableVideo = `<p>[![](https://ipfs-3speak.b-cdn.net/ipfs/${video.thumbUrl})](https://3speak.tv/watch?v=${video.owner}/${video.permlink})</p>`;

      if (video.status === "publish_manual") {
        setPublishingVideo(video);

        editor.chain().insertContent(attachableVideo).run();
      } else if (video.status === "published") {
        clearPublishingVideo();
        editor.chain().insertContent(attachableVideo).run();
      }
    },
    [editor]
  );
}
