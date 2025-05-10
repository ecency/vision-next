import { ThreeSpeakVideo } from "@ecency/sdk";
import { TAG_MENTION_PURE_REGEX, USER_MENTION_PURE_REGEX } from "../extensions";

export function parseAllExtensionsToDoc(value?: string, publishingVideo?: ThreeSpeakVideo) {
  console.log(publishingVideo);
  const tree = document.createElement("body");
  tree.innerHTML = value ?? "";

  (Array.from(tree.querySelectorAll("a[href]").values()) as HTMLElement[])
    .filter((el) => el.getAttribute("href")?.includes("3speak.tv"))
    .forEach((el) => {
      const image = el.querySelector("img");
      const newEl = document.createElement("div");

      const isPublishingVideo =
        el.getAttribute("href") ===
        (publishingVideo &&
          `https://3speak.tv/watch?v=${publishingVideo.owner}/${publishingVideo.permlink}`);

      newEl.dataset.threeSpeakVideo = "";
      newEl.setAttribute("src", el.getAttribute("href") ?? "");
      newEl.setAttribute("thumbnail", image?.getAttribute("src") ?? "");
      newEl.setAttribute("status", isPublishingVideo ? "publish_manual" : "published");

      el.parentElement?.replaceChild(newEl, el);
    });

  const result = tree.innerHTML;

  return result
    .replace(
      USER_MENTION_PURE_REGEX,
      (match) => `<span data-type="mention" data-id=${match.replace("@", "")}></span>`
    )
    .replace(
      TAG_MENTION_PURE_REGEX,
      (match) => `<span data-type="tag" data-id=${match.replace("#", "")} /></span>`
    );
}
