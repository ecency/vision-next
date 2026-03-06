"use client";

import { useState, useCallback } from "react";
import { Button } from "@ui/button";
import i18next from "i18next";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { getLoginType } from "@/utils/user-token";
import { decryptMemo } from "@/utils/memo-crypto";
import { error } from "@/features/shared";

interface Props {
  memo: string;
}

export function MemoDisplay({ memo }: Props) {
  const { activeUser } = useActiveAccount();
  const [decryptedText, setDecryptedText] = useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);

  const handleDecrypt = useCallback(async () => {
    if (!activeUser) return;

    setIsDecrypting(true);
    try {
      const loginType = getLoginType(activeUser.username);
      const result = await decryptMemo(loginType, activeUser.username, memo);
      setDecryptedText(result);
    } catch (e) {
      error(i18next.t("transfer.memo-decrypt-error"));
    } finally {
      setIsDecrypting(false);
    }
  }, [activeUser, memo]);

  if (decryptedText !== null) {
    return (
      <div className="text-sm text-gray-600 dark:text-gray-400 break-words">
        <span className="text-xs text-gray-500">🔓 </span>
        {decryptedText}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
      <span>🔒 {i18next.t("transfer.memo-encrypted-label")}</span>
      {activeUser && (
        <Button
          size="xs"
          appearance="secondary"
          outline={true}
          disabled={isDecrypting}
          onClick={handleDecrypt}
        >
          {i18next.t("transfer.memo-decrypt")}
        </Button>
      )}
    </div>
  );
}
