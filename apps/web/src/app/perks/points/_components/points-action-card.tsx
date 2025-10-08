import { Button } from "@/features/ui";
import Image from "next/image";
import { ReactNode } from "react";

interface Props {
  imageSrc: string;
  title: string;
  description: string;
  buttonText: ReactNode;
  buttonDisabled?: boolean;
  buttonLoading?: boolean;
  onClick: () => void;
}

export function PointsActionCard({
  imageSrc,
  title,
  description,
  buttonText,
  buttonDisabled = false,
  buttonLoading = false,
  onClick
}: Props) {
  return (
    <div className="p-2 md:p-4 lg:p-6 bg-white rounded-xl w-full flex flex-col justify-between gap-4">
      <div className="flex flex-col">
        <Image width={250} height={150} alt="" src={imageSrc} className="mx-auto h-[150px]" />
        <div className="font-bold mt-8 lg:mt-12">{title}</div>
        <div className="opacity-50">{description}</div>
      </div>
      <Button size="lg" onClick={onClick} disabled={buttonDisabled} isLoading={buttonLoading}>
        {buttonText}
      </Button>
    </div>
  );
}
