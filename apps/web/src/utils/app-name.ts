import { stripTags } from "./strip-tags";

interface ObjInput {
  name?: unknown;
}

export function appName(input: string | null | undefined | ObjInput) {
  if (!input) {
    return "";
  }

  if (typeof input === "string") {
    return stripTags(input);
  }

  // json_metadata.app is untrusted: {name: null} / {name: 123} reach here from
  // buggy clients and used to throw on .replace during entry-page SSR.
  if (typeof input === "object" && typeof input.name === "string") {
    return stripTags(input.name);
  }

  return "";
}
