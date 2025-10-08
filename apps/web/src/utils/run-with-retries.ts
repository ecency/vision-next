import { delay } from "@/utils/delay";

export async function runWithRetries(
  task: () => boolean | Promise<boolean>,
  delayMs = 100,
  retries = 3
) {
  await delay(delayMs);

  const result = await task();
  if (result) {
    return true;
  }

  if (retries > 0) {
    return await runWithRetries(task, delayMs, retries - 1);
  }

  return true;
}
