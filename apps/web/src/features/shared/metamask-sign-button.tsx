import { Button } from "@/features/ui";
import i18next from "i18next";
import Image from "next/image";

interface Props {
  onClick: () => void;
  className?: string;
  size?: "sm" | "lg";
}

export function MetaMaskSignButton({ onClick, className = "w-full", size = "lg" }: Props) {
  return (
    <Button
      size={size}
      outline={true}
      appearance="secondary"
      className={className}
      onClick={onClick}
      icon={
        <Image
          width={100}
          height={100}
          src="/assets/metamask-fox.svg"
          className="w-4 h-4"
          alt="metamask"
        />
      }
    >
      {i18next.t("key-or-hot.sign-with-metamask", { defaultValue: "Sign with MetaMask" })}
    </Button>
  );
}
