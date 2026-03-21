"use client";

import { useActiveAccount } from "@/core/hooks/use-active-account";
import { withFeatureFlag } from "@/core/react-query";
import { error, success } from "@/features/shared";
import { Button, FormControl } from "@/features/ui";
import { getAccessToken, ensureValidToken } from "@/utils";
import {
  getAiGeneratePriceQueryOptions,
  getPointsQueryOptions,
  useAddImage,
  useGenerateImage,
  type AiImagePowerTier,
} from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { motion } from "framer-motion";
import i18next from "i18next";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";

interface Props {
  onInsert?: (url: string) => void;
  showInsertAction?: boolean;
  suggestedPrompt?: string;
}

const ASPECT_RATIO_LABELS: Record<string, string> = {
  "1:1": "1:1",
  "16:9": "16:9",
  "9:16": "9:16",
  "4:3": "4:3",
  "3:4": "3:4",
  "3:2": "3:2",
  "2:3": "2:3",
};

const POWER_LABELS: Record<number, string> = {
  1: "1x",
  2: "2x",
  4: "4x",
  6: "6x",
};

export function AiImageGenerator({ onInsert, showInsertAction = true, suggestedPrompt }: Props) {
  const { activeUser } = useActiveAccount();
  const username = activeUser?.username;

  const accessToken = username ? getAccessToken(username) : "";

  const { data: activeUserPoints, isPending: isPointsPending } = useQuery(
    withFeatureFlag(
      ({ visionFeatures }) => visionFeatures.points.enabled,
      getPointsQueryOptions(username)
    )
  );

  const { data: priceData, isLoading: isPricesLoading } = useQuery(
    getAiGeneratePriceQueryOptions(accessToken ?? "")
  );

  const prices = priceData?.prices;
  const powerTiers = priceData?.power;

  const { mutateAsync: generateImage, isPending: isGenerating } = useGenerateImage(
    username,
    accessToken
  );

  const { mutateAsync: addToGallery } = useAddImage(username, accessToken);

  const [prompt, setPrompt] = useState("");
  const [selectedRatio, setSelectedRatio] = useState<string | null>(null);
  const [selectedPower, setSelectedPower] = useState<AiImagePowerTier | null>(null);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (prices && prices.length > 0 && !selectedRatio) {
      const defaultRatio = prices.find((p) => p.aspect_ratio === "16:9");
      setSelectedRatio(defaultRatio?.aspect_ratio ?? prices[0].aspect_ratio);
    }
  }, [prices, selectedRatio]);

  useEffect(() => {
    if (powerTiers && powerTiers.length > 0 && !selectedPower) {
      setSelectedPower(powerTiers[0]);
    }
  }, [powerTiers, selectedPower]);

  const charsRemaining = 1000 - prompt.length;

  const baseCost = useMemo(() => {
    if (prices && prices.length > 0) return prices[0].cost;
    return 150;
  }, [prices]);

  const cost = useMemo(() => {
    return baseCost * (selectedPower?.multiplier ?? 1);
  }, [baseCost, selectedPower]);

  const isInsufficientBalance = useMemo(() => {
    if (activeUserPoints) {
      return +activeUserPoints.points < cost;
    }
    return false;
  }, [activeUserPoints, cost]);

  const canGenerate =
    prompt.trim().length > 0 && selectedRatio && !isInsufficientBalance && !isGenerating;

  const handleGenerate = useCallback(async () => {
    if (!selectedRatio || !prompt.trim()) return;

    try {
      const token = username ? await ensureValidToken(username) : undefined;
      if (!token) {
        error(i18next.t("ai-image-generator.error-auth"));
        return;
      }

      const result = await generateImage({
        prompt: prompt.trim(),
        aspect_ratio: selectedRatio,
        power: selectedPower?.power ?? 1,
      });

      setGeneratedUrl(result.url);
      success(i18next.t("ai-image-generator.success"));

      // Auto-add to user's gallery (non-blocking)
      addToGallery({ url: result.url, code: token }).catch(() => {});
    } catch (err: any) {
      const status = err?.status;
      const data = err?.data;

      if (status === 402) {
        error(
          i18next.t("ai-image-generator.error-insufficient-points", {
            required: data?.required ?? cost,
            available: data?.available ?? "0",
          })
        );
      } else if (status === 422) {
        error(i18next.t("ai-image-generator.error-content-policy"));
      } else if (status === 429) {
        error(i18next.t("ai-image-generator.error-rate-limit"));
      } else {
        error(i18next.t("ai-image-generator.error-generic"));
      }
    }
  }, [selectedRatio, selectedPower, prompt, username, generateImage, cost]);

  const handleGenerateAgain = useCallback(() => {
    setGeneratedUrl(null);
  }, []);

  const handleDownload = useCallback(() => {
    if (generatedUrl) {
      window.open(generatedUrl, "_blank");
    }
  }, [generatedUrl]);

  // Result view
  if (generatedUrl) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col gap-4"
      >
        <div className="font-semibold">{i18next.t("ai-image-generator.result-title")}</div>
        <div className="border border-[--border-color] rounded-xl overflow-hidden">
          <Image
            src={generatedUrl}
            alt={prompt}
            width={1024}
            height={1024}
            className="w-full h-auto"
            unoptimized={true}
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {showInsertAction && onInsert && (
            <Button size="sm" onClick={() => onInsert(generatedUrl)}>
              {i18next.t("ai-image-generator.insert-button")}
            </Button>
          )}
          <Button size="sm" appearance="gray" onClick={handleDownload}>
            {i18next.t("ai-image-generator.download-button")}
          </Button>
          <Button size="sm" appearance="gray-link" onClick={handleGenerateAgain}>
            {i18next.t("ai-image-generator.generate-again")}
          </Button>
        </div>
      </motion.div>
    );
  }

  // Generator form
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="opacity-50">{i18next.t("ai-image-generator.balance-label")}:</div>
          <div className="text-blue-dark-sky">
            {isPointsPending
              ? "..."
              : `${activeUserPoints?.points ?? "0"} ${i18next.t("ai-image-generator.points-unit")}`}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="opacity-50">{i18next.t("ai-image-generator.cost-label")}:</div>
          <div className="text-blue-dark-sky font-semibold">
            {cost} {i18next.t("ai-image-generator.points-unit")}
          </div>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-1 block">
          {i18next.t("ai-image-generator.prompt-label")}
        </label>
        <FormControl
          type="textarea"
          value={prompt}
          onChange={(e: any) => setPrompt(e.target.value.slice(0, 1000))}
          placeholder={i18next.t("ai-image-generator.prompt-placeholder")}
          rows={3}
        />
        <div className={clsx("text-xs mt-1", charsRemaining < 50 ? "text-red" : "opacity-50")}>
          {i18next.t("ai-image-generator.prompt-chars-remaining", { count: charsRemaining })}
        </div>
        {suggestedPrompt && !prompt.trim() && (
          <button
            type="button"
            className="text-xs mt-2 px-3 py-1.5 rounded-full border border-blue-dark-sky/30 bg-blue-dark-sky/5 text-blue-dark-sky hover:bg-blue-dark-sky/10 transition-colors truncate max-w-full text-left"
            onClick={() => setPrompt(suggestedPrompt.slice(0, 1000))}
          >
            {i18next.t("ai-image-generator.use-suggestion", {
              suggestion: suggestedPrompt.length > 80 ? suggestedPrompt.slice(0, 80) + "\u2026" : suggestedPrompt
            })}
          </button>
        )}
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">
          {i18next.t("ai-image-generator.select-aspect-ratio")}
        </label>
        {isPricesLoading ? (
          <div className="opacity-50">...</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {prices?.map((price, i) => (
              <motion.div
                key={price.aspect_ratio}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={clsx(
                  "border px-3 py-2 rounded-lg cursor-pointer text-sm font-medium",
                  selectedRatio === price.aspect_ratio
                    ? "border-blue-dark-sky bg-blue-dark-sky/10 text-blue-dark-sky"
                    : "border-[--border-color] hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
                onClick={() => setSelectedRatio(price.aspect_ratio)}
              >
                {ASPECT_RATIO_LABELS[price.aspect_ratio] ?? price.aspect_ratio}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {powerTiers && powerTiers.length > 1 && (
        <div>
          <label className="text-sm font-medium mb-2 block">
            {i18next.t("ai-image-generator.select-power")}
          </label>
          <div className="flex flex-wrap gap-2">
            {powerTiers.map((tier, i) => (
              <motion.div
                key={tier.power}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={clsx(
                  "border px-3 py-2 rounded-lg cursor-pointer text-sm font-medium",
                  selectedPower?.power === tier.power
                    ? "border-blue-dark-sky bg-blue-dark-sky/10 text-blue-dark-sky"
                    : "border-[--border-color] hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
                onClick={() => setSelectedPower(tier)}
              >
                {POWER_LABELS[tier.power] ?? `${tier.power}x`}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {isInsufficientBalance && (
        <small className="text-red block">
          {i18next.t("market.more-than-balance")}
        </small>
      )}

      <div className="flex justify-end">
        <Button
          disabled={!canGenerate}
          isLoading={isGenerating}
          onClick={handleGenerate}
        >
          {isGenerating
            ? i18next.t("ai-image-generator.generating")
            : i18next.t("ai-image-generator.generate-button")}
        </Button>
      </div>
    </div>
  );
}
