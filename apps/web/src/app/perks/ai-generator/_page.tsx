"use client";

import { EcencyConfigManager } from "@/config";
import { Button } from "@/features/ui";
import { UilArrowLeft } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import Link from "next/link";
import { AiImageGenerator } from "@/features/shared/ai-image-generator";

export function AiGeneratorPage() {
  return (
    <EcencyConfigManager.Conditional
      condition={({ visionFeatures }) => visionFeatures.aiImageGenerator.enabled}
    >
      <div className="p-2 md:p-4 lg:p-6 bg-white dark:bg-dark-200 rounded-xl w-full flex flex-col gap-4">
        <div>
          <Link href="/perks">
            <Button
              size="sm"
              appearance="gray-link"
              icon={<UilArrowLeft />}
              iconPlacement="left"
              noPadding={true}
            >
              {i18next.t("g.back")}
            </Button>
          </Link>
          <h1 className="font-bold text-xl mt-2 md:mt-4 lg:mt-6">
            {i18next.t("ai-image-generator.page-title")}
          </h1>
          <h2 className="opacity-50 mb-4">
            {i18next.t("ai-image-generator.page-description")}
          </h2>
        </div>
        <AiImageGenerator showInsertAction={false} />
      </div>
    </EcencyConfigManager.Conditional>
  );
}
