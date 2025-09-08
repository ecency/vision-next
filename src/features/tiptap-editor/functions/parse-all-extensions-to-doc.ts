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
    .filter((el) => {
        const href = el.getAttribute("href") ?? "";
        HIVE_POST_PURE_REGEX.lastIndex = 0;
        return HIVE_POST_PURE_REGEX.test(href) && el.innerText.trim() === href;
    })
    .forEach((el) => {
      const newEl = document.createElement("div");
      newEl.dataset.hivePost = "";
      newEl.setAttribute("href", el.getAttribute("href") ?? "");

      el.parentElement?.replaceChild(newEl, el);
    });

  // Handle mentions
  // We cannot use :has selector because some browsers like Safari 15 doesn't support it well
  (Array.from(tree.querySelectorAll("*:not(a)")) as HTMLElement[])
    .filter((el) => !el.querySelector("a") && USER_MENTION_PURE_REGEX.test(el.innerText))
    .forEach((el) => {
      el.innerHTML = el.innerHTML.replace(
        USER_MENTION_PURE_REGEX,
        (match) => `<span data-type="mention" data-id=${match.replace("@", "")}></span>`
      );
    });

  // Handle tags
  // We cannot use :has selector because some browsers like Safari 15 doesn't support it well
  (Array.from(tree.querySelectorAll("*:not(a)")) as HTMLElement[])
    .filter((el) => !el.querySelector("a") && TAG_MENTION_PURE_REGEX.test(el.innerText))
    .forEach((el) => {
      el.innerHTML = el.innerHTML.replace(
        TAG_MENTION_PURE_REGEX,
        (match) => `<span data-type="tag" data-id=${match.replace("#", "")} /></span>`
      );
    });

  // Handle image alignment wrappers
  (Array.from(
    tree.querySelectorAll("div.pull-left, div.pull-right")
  ) as HTMLElement[]).forEach((el) => {
    const img = el.querySelector("img");
    if (img) {
      const cls = el.classList.contains("pull-left") ? "pull-left" : "pull-right";
      img.setAttribute("class", cls);
      el.parentElement?.replaceChild(img, el);
    }
  });

  (Array.from(tree.querySelectorAll("center")) as HTMLElement[]).forEach((el) => {
    const img = el.querySelector("img");
    if (img) {
      const p = document.createElement("p");
      p.style.textAlign = "center";
      p.appendChild(img);
      el.parentElement?.replaceChild(p, el);
    }
  });

  // Ensure list items have a paragraph before nested lists to satisfy ProseMirror schema
  (Array.from(tree.querySelectorAll("li")) as HTMLElement[]).forEach((li) => {
    const first = li.firstElementChild;
    if (first && (first.tagName === "OL" || first.tagName === "UL")) {
      const p = document.createElement("p");
      li.insertBefore(p, first);
    }
  });
  return tree.innerHTML;
}
