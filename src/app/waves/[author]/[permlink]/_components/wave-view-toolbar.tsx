"use client";

import { WavesNavigationLayout } from "@/app/waves/_components";
import { Button } from "@ui/button";
import { UilArrowLeft } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export function WaveViewToolbar() {
  const router = useRouter();

  return (
    <WavesNavigationLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="w-full flex items-center py-2"
      >
        <Button
          appearance="gray-link"
          icon={<UilArrowLeft />}
          iconPlacement="left"
          onClick={() => router.back()}
          className="capitalize"
        >
          {i18next.t("g.back")}
        </Button>
      </motion.div>
    </WavesNavigationLayout>
  );
}
