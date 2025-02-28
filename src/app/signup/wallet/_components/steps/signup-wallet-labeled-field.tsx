import { PropsWithChildren } from "react";

interface Props {
  label: string;
}

export function SignupWalletLabeledField({ label, children }: PropsWithChildren<Props>) {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-sm px-2 opacity-75 font-semibold">{label}</div>
      {children}
    </div>
  );
}
