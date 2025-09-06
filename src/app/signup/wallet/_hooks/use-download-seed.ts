import { useCallback } from "react";
import { useSeedPhrase, useHiveKeysQuery } from "@ecency/wallets";
import { v4 } from "uuid";

export function useDownloadSeed(username: string) {
  const { data: seed } = useSeedPhrase(username);

  const { data: accountKeys } = useHiveKeysQuery(username);

  return useCallback(() => {
    const element = document.createElement("a");
    const keys = Object.entries(accountKeys ?? {})
      .map(([name, key]) => `${name}: ${key}`)
      .join("\n");

    element.setAttribute(
      "href",
      "data:text/plain;charset=utf-8," + encodeURIComponent(`Seed: ${seed}\n\n${keys}`)
    );
    element.setAttribute("download", `ecency-${username}-seed-${v4().split("-")[2]}.txt`);

    element.style.display = "none";
    document.body.appendChild(element);

    element.click();

    // Ensure the temporary element is removed without errors
    element.remove();
  }, [seed, username, accountKeys]);
}
