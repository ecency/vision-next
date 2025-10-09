"use client";

import { apiBase } from "@/api/helper";
import { useGlobalStore } from "@/core/global-store";
import Image from "next/image";

interface Props {
  className?: string;
}

export function FaqHeroImage({ className }: Props) {
  const canUseWebp = useGlobalStore((state) => state.canUseWebp);
  const faqImage = apiBase(`/assets/ecency-faq.${canUseWebp ? "webp" : "jpg"}`);

  return (
    <Image
      alt="FAQ-image"
      width={1000}
      height={1000}
      src={faqImage}
      className={["rounded", className].filter(Boolean).join(" ")}
    />
  );
}
