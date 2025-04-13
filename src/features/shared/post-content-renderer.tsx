"use client";

import { EcencyRenderer } from "@ecency/renderer";
import dynamic from "next/dynamic";
import { HTMLProps, memo, useCallback, useState } from "react";

const MemoizedEcencyRenderer = memo(EcencyRenderer);
// As Next renders RSC client type on server and client both then it should skip renderinng
//    of this component on a server because it strongly require on some client only features
const TransactionSigner = dynamic(() => import("./transactions/transaction-signer"), {
  ssr: false
});

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
