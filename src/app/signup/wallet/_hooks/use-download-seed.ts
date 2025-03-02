import { useCallback } from "react";
import { useSeedPhrase } from "@ecency/wallets";

export function useDownloadSeed(username: string) {
  const { data: seed } = useSeedPhrase();

  return useCallback(() => {
    const element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/plain;charset=utf-8," +
        encodeURIComponent(`Hive username: ${username}\nSeed: ${seed}`)
    );
    element.setAttribute("download", `ecency-${username}-seed.txt`);

    element.style.display = "none";
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  }, [seed, username]);
}
