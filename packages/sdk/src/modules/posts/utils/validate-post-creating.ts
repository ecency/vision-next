import { CONFIG } from "@/modules/core";
import { Entry } from "../types";

export type ValidatePostCreatingOptions = {
  delays?: number[];
};

const DEFAULT_VALIDATE_POST_DELAYS = [3000, 3000, 3000];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function getContent(author: string, permlink: string): Promise<Entry> {
  return CONFIG.hiveClient.call("condenser_api", "get_content", [
    author,
    permlink,
  ]) as Promise<Entry>;
}

export async function validatePostCreating(
  author: string,
  permlink: string,
  attempts = 0,
  options?: ValidatePostCreatingOptions
) {
  const delays = options?.delays ?? DEFAULT_VALIDATE_POST_DELAYS;

  let response: Entry | undefined;
  try {
    response = await getContent(author, permlink);
  } catch (e) {
    response = undefined;
  }

  if (response || attempts >= delays.length) {
    return;
  }

  const waitMs = delays[attempts];
  if (waitMs > 0) {
    await delay(waitMs);
  }

  return validatePostCreating(author, permlink, attempts + 1, options);
}
