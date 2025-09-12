import { useCallback } from "react";
import i18next from "i18next";

interface Keys {
  owner?: string;
  active?: string;
  posting?: string;
  memo?: string;
}

export function useDownloadKeys(
  username: string,
  seed: string,
  keys: Keys | undefined
) {
  return useCallback(() => {
    if (!keys || !username) {
      return;
    }

    const element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/plain;charset=utf-8," +
        encodeURIComponent(buildFileContent(username, seed, keys))
    );
    element.setAttribute("download", `ecency-${username}-seed.txt`);

    element.style.display = "none";
    document.body.appendChild(element);

    element.click();
    element.remove();
  }, [username, seed, keys]);
}

function buildFileContent(username: string, seed: string, keys: Keys) {
  return `
Seed: ${seed}

username: ${username}

${i18next.t("onboard.owner-private")} ${keys.owner}

${i18next.t("onboard.active-private")} ${keys.active}

${i18next.t("onboard.posting-private")} ${keys.posting}

${i18next.t("onboard.memo-private")} ${keys.memo}

${i18next.t("onboard.keys-use")}
${i18next.t("onboard.owner")} ${i18next.t("onboard.owner-use")}
${i18next.t("onboard.active")} ${i18next.t("onboard.active-use")}
${i18next.t("onboard.posting")} ${i18next.t("onboard.posting-use")}
${i18next.t("onboard.memo")} ${i18next.t("onboard.memo-use")}

${i18next.t("onboard.file-warning")}

${i18next.t("onboard.recommend")}
1. ${i18next.t("onboard.recommend-print")}
2. ${i18next.t("onboard.recommend-use")}
3. ${i18next.t("onboard.recommend-save")}
4. ${i18next.t("onboard.recommend-third-party")}

`;
}

