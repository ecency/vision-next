import { ThreeSpeakVideo } from "@ecency/sdk";
import {
  HIVE_POST_PURE_REGEX,
  TAG_MENTION_PURE_REGEX,
  USER_MENTION_PURE_REGEX
} from "../extensions";

export function parseAllExtensionsToDoc(value?: string, publishingVideo?: ThreeSpeakVideo) {
  const tree = document.createElement("body");
  tree.innerHTML = value ?? "";

  // Handle 3speak videos
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

  // Handle hive posts
  (Array.from(tree.querySelectorAll("a[href]").values()) as HTMLElement[])
    .filter((el) => HIVE_POST_PURE_REGEX.test(el.getAttribute("href") ?? ""))
    .forEach((el) => {
      const newEl = document.createElement("div");
      newEl.dataset.hivePost = "";
      newEl.setAttribute("href", el.getAttribute("href") ?? "");

      el.parentElement?.replaceChild(newEl, el);
    });

  // Handle mentions
  (Array.from(tree.querySelectorAll("*:not(:has(a)):not(a)").values()) as HTMLElement[])
    .filter((el) => USER_MENTION_PURE_REGEX.test(el.innerText))
    .forEach((el) => {
      el.innerHTML = el.innerHTML.replace(
        USER_MENTION_PURE_REGEX,
        (match) => `<span data-type="mention" data-id=${match.replace("@", "")}></span>`
      );
    });

  // Handle tags
  (Array.from(tree.querySelectorAll("*:not(:has(a)):not(a)").values()) as HTMLElement[])
    .filter((el) => USER_MENTION_PURE_REGEX.test(el.innerText))
    .forEach((el) => {
      el.innerHTML = el.innerHTML.replace(
        TAG_MENTION_PURE_REGEX,
        (match) => `<span data-type="tag" data-id=${match.replace("#", "")} /></span>`
      );
    });
  return tree.innerHTML;
}
