"use client";

import { EcencyRenderer } from "@ecency/renderer";
import { HTMLProps, memo, useCallback, useEffect, useState } from "react";
import { Tweet } from "react-tweet";
import TransactionSigner from "./transactions/transaction-signer";

const MemoizedEcencyRenderer = memo(EcencyRenderer);

interface Props {
  value: string;
}

export function PostContentRenderer({
  value,
  ...props
}: Props & Omit<HTMLProps<HTMLDivElement>, "value">) {
  const [signingOperation, setSigningOperation] = useState<string>();
  const [isHydrated, setIsHydrated] = useState(false);

  const handleHiveOperationClick = useCallback((e: string) => setSigningOperation(e), []);

  // Ensure the component only renders after hydration is complete
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Don't render the EcencyRenderer until hydration is complete
  if (!isHydrated) {
    return null;
  }

  return (
    <>
      <div suppressHydrationWarning>
        <MemoizedEcencyRenderer
          value={value}
          {...(props as any)}
          onHiveOperationClick={handleHiveOperationClick}
          TwitterComponent={Tweet}
        />
      </div>
      <TransactionSigner
        show={!!signingOperation}
        onHide={() => setSigningOperation(undefined)}
        operation={signingOperation}
      />
    </>
  );
}
