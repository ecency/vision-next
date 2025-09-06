import defaults from "@/defaults.json";
import { makeEntryPath } from "./make-path";

export const makeEcencyUrl = (cat: string, author: string, permlink: string): string => {
  const path = makeEntryPath(cat, author, permlink);
  if (path === "#") {
    return "#";
  }
  return `${defaults.base}${path}`;
};

export const makeCopyAddress = (
  title: string,
  cat: string,
  author: string,
  permlink: string
): string => {
  const path = makeEntryPath(cat, author, permlink);
  return path === "#" ? "#" : `[${title}](${path})`;
};

export const makeShareUrlReddit = (
  cat: string,
  author: string,
  permlink: string,
  title: string
): string => {
  const u = makeEcencyUrl(cat, author, permlink);
  return `https://reddit.com/submit?url=${encodeURIComponent(u)}&title=${encodeURIComponent(
    title
  )}`;
};

export const makeShareUrlTwitter = (
  cat: string,
  author: string,
  permlink: string,
  title: string
): string => {
  const u = makeEcencyUrl(cat, author, permlink);
  return `https://twitter.com/intent/tweet?url=${encodeURIComponent(u)}&text=${encodeURIComponent(
    title
  )}`;
};

export const makeShareUrlFacebook = (cat: string, author: string, permlink: string): string => {
  const u = makeEcencyUrl(cat, author, permlink);
  return `https://www.facebook.com/sharer.php?u=${encodeURIComponent(u)}`;
};

export const makeShareUrlLinkedin = (cat: string, author: string, permlink: string): string => {
  const u = makeEcencyUrl(cat, author, permlink);
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(u)}`;
};
