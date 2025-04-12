"use client";

import { EcencyRenderer } from "@ecency/renderer";
import { HTMLProps, memo, useCallback, useState } from "react";
import { TransactionSigner } from "./transactions";

const MemoizedEcencyRenderer = memo(EcencyRenderer);

interface Props {
  value: string;
}

export function PostContentRenderer({
  value,
  ...props
}: Props & Omit<HTMLProps<HTMLDivElement>, "value">) {
  const [signingOperation, setSigningOperation] = useState<string>();

  const handleHiveOperationClick = useCallback((e: string) => setSigningOperation(e), []);

  return (
    <>
      <MemoizedEcencyRenderer
        value={value}
        {...(props as any)}
        onHiveOperationClick={handleHiveOperationClick}
      />
      <TransactionSigner
        show={!!signingOperation}
        onHide={() => setSigningOperation(undefined)}
        operation={signingOperation}
      />
    </>
  );
}
