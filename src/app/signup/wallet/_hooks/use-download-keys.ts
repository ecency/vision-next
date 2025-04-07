import { useCallback } from "react";

export function useDownloadKeys(username: string, accountKeys: any | undefined) {
  return useCallback(() => {
    const element = document.createElement("a");
    const keys = Object.entries(accountKeys ?? {})
      .map(([name, key]) => `${name}: ${key}`)
      .join("\n");
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(keys));
    element.setAttribute("download", `ecency-${username}-keys.txt`);

    element.style.display = "none";
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  }, [accountKeys, username]);
}
