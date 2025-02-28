import { Button, FormControl, InputGroup, InputGroupCopyClipboard } from "@/features/ui";
import { UilEye } from "@tooni/iconscout-unicons-react";
import { useMemo, useState } from "react";

interface Props {
  privateKey: string | undefined;
}

export function SignupWalletPrivateKeyField({ privateKey }: Props) {
  const [hasPrivateKeyRevealed, setHasPrivateKeyRevealed] = useState(false);

  const value = useMemo(
    () => (hasPrivateKeyRevealed ? privateKey : "************************"),
    [privateKey, hasPrivateKeyRevealed]
  );

  return (
    <div className="w-full flex flex-col gap-2">
      <div className="text-sm px-2 opacity-75 font-semibold">Private key</div>
      {!hasPrivateKeyRevealed && (
        <InputGroup
          append={
            <Button
              appearance="gray-link"
              icon={<UilEye />}
              onClick={() => setHasPrivateKeyRevealed(true)}
            />
          }
        >
          <FormControl type="text" readOnly={true} value={value} />
        </InputGroup>
      )}
      {hasPrivateKeyRevealed && <InputGroupCopyClipboard value={value ?? ""} />}
    </div>
  );
}
