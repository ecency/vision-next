import { useCallback, useMemo } from "react";
import { deriveHiveKeys } from "@ecency/wallets";
import { v4 } from "uuid";

export function useDownloadSeed(seed: string | undefined, username: string) {
  const accountKeys = useMemo(() => (seed ? deriveHiveKeys(seed) : undefined), [seed]);

  return useCallback(() => {
    if (!seed) {
      return;
    }

    const keys = Object.entries(accountKeys ?? {})
      .map(([name, key]) => `${name}: ${key}`)
      .join("\n");

    const content = `Seed: ${seed}\n\nusername: ${username}\n${keys}`;

    // Use Blob for better mobile browser compatibility (especially iOS Safari)
    // data: URLs have size limits and compatibility issues on mobile
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const element = document.createElement("a");
    element.setAttribute("href", url);
    element.setAttribute("download", `ecency-${username}-seed-${v4().split("-")[2]}.txt`);

    element.style.display = "none";
    document.body.appendChild(element);

    element.click();

    // Clean up: remove element and revoke blob URL
    element.remove();
    // Revoke after a short delay to ensure download starts
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }, [seed, username, accountKeys]);
}
