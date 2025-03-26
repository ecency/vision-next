import { useCallback } from "react";
import { useSeedPhrase, useHiveKeysQuery } from "@ecency/sdk";

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
    element.setAttribute("download", `ecency-${username}-seed.txt`);

    element.style.display = "none";
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  }, [seed, username, accountKeys]);
}
