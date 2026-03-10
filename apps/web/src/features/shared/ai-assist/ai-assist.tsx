"use client";

import { useActiveAccount } from "@/core/hooks/use-active-account";
import { withFeatureFlag } from "@/core/react-query";
import { error, success } from "@/features/shared";
import { Button, FormControl } from "@/features/ui";
import { getAccessToken, ensureValidToken } from "@/utils";
import {
  getAiAssistPriceQueryOptions,
  getPointsQueryOptions,
  useAiAssist,
} from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { motion } from "framer-motion";
import i18next from "i18next";
import { useCallback, useMemo, useState } from "react";

const ACTIONS = ["improve", "suggest_tags", "generate_title", "summarize", "check_grammar"];

interface Props {
  onApply?: (output: string, action: string) => void;
  initialText?: string;
}

export function AiAssist({ onApply, initialText = "" }: Props) {
  const { activeUser } = useActiveAccount();
  const username = activeUser?.username;
  const accessToken = username ? getAccessToken(username) : "";

  const { data: activeUserPoints, isPending: isPointsPending } = useQuery(
    withFeatureFlag(
      ({ visionFeatures }) => visionFeatures.points.enabled,
      getPointsQueryOptions(username)
    )
  );

  const { data: prices, isLoading: isPricesLoading } = useQuery(
    getAiAssistPriceQueryOptions(username, accessToken ?? "")
  );

  const { mutateAsync: runAssist, isPending: isProcessing } = useAiAssist(username, accessToken);

  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [text, setText] = useState(initialText);
  const [result, setResult] = useState<{ output: string; action: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const selectedPrice = useMemo(() => {
    if (!selectedAction || !prices) return null;
    return prices.find((p) => p.action === selectedAction) ?? null;
  }, [selectedAction, prices]);

  const minInput = useMemo(() => {
    if (!selectedAction) return 50;
    if (selectedAction === "improve" || selectedAction === "check_grammar") return 50;
    return 100;
  }, [selectedAction]);

  const maxInput = 10000;
  const charsRemaining = maxInput - text.length;

  const isFree = selectedPrice ? (selectedPrice.free_remaining ?? 0) > 0 : false;
  const cost = isFree ? 0 : (selectedPrice?.cost ?? 0);

  const isInsufficientBalance = useMemo(() => {
    if (isFree) return false;
    if (activeUserPoints && selectedPrice) {
      return +activeUserPoints.points < selectedPrice.cost;
    }
    return false;
  }, [activeUserPoints, selectedPrice, isFree]);

  const canSubmit =
    selectedAction && selectedPrice && !isPricesLoading && text.trim().length >= minInput && !isInsufficientBalance && !isProcessing;

  const handleSubmit = useCallback(async () => {
    if (!selectedAction || !text.trim()) return;

    if (text.trim().length < minInput) {
      error(i18next.t("ai-assist.error-text-too-short", { count: minInput }));
      return;
    }

    try {
      const token = username ? await ensureValidToken(username) : undefined;
      if (!token) {
        error(i18next.t("ai-assist.error-auth"));
        return;
      }

      const res = await runAssist({
        action: selectedAction,
        text: text.trim(),
      });

      setResult({ output: res.output, action: res.action });
      success(i18next.t("ai-assist.success"));
    } catch (err: any) {
      const status = err?.status;
      const data = err?.data;

      if (status === 402) {
        error(
          i18next.t("ai-assist.error-insufficient-points", {
            required: data?.required ?? cost,
            available: data?.available ?? "0",
          })
        );
      } else if (status === 422) {
        error(i18next.t("ai-assist.error-content-policy"));
      } else if (status === 429) {
        error(i18next.t("ai-assist.error-rate-limit"));
      } else {
        error(i18next.t("ai-assist.error-generic"));
      }
    }
  }, [selectedAction, text, username, runAssist, cost, minInput]);

  const handleCopy = useCallback(() => {
    if (result) {
      navigator.clipboard.writeText(result.output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [result]);

  const handleTryAgain = useCallback(() => {
    setResult(null);
  }, []);

  const handleTryAnother = useCallback(() => {
    setResult(null);
    setSelectedAction(null);
  }, []);

  // Result view
  if (result) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col gap-4"
      >
        <div className="font-semibold">{i18next.t("ai-assist.result-title")}</div>
        <div className="border border-[--border-color] rounded-xl p-4 max-h-[400px] overflow-y-auto whitespace-pre-wrap text-sm">
          {result.output}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {onApply && (
            <Button size="sm" onClick={() => onApply(result.output, result.action)}>
              {i18next.t("ai-assist.apply-button")}
            </Button>
          )}
          <Button size="sm" appearance="gray" onClick={handleCopy}>
            {copied ? i18next.t("ai-assist.copied") : i18next.t("ai-assist.copy-button")}
          </Button>
          <Button size="sm" appearance="gray-link" onClick={handleTryAgain}>
            {i18next.t("ai-assist.try-again")}
          </Button>
          <Button size="sm" appearance="gray-link" onClick={handleTryAnother}>
            {i18next.t("ai-assist.try-another")}
          </Button>
        </div>
      </motion.div>
    );
  }

  // Form view
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="opacity-50">{i18next.t("ai-assist.balance-label")}:</div>
          <div className="text-blue-dark-sky">
            {isPointsPending
              ? "..."
              : `${activeUserPoints?.points ?? "0"} ${i18next.t("ai-assist.points-unit")}`}
          </div>
        </div>
        {selectedPrice && (
          <div className="flex items-center gap-2">
            <div className="opacity-50">{i18next.t("ai-assist.cost-label")}:</div>
            <div className="text-blue-dark-sky font-semibold">
              {isFree ? (
                <span className="text-green-500">{i18next.t("ai-assist.free-label")}</span>
              ) : (
                `${selectedPrice.cost} ${i18next.t("ai-assist.points-unit")}`
              )}
            </div>
          </div>
        )}
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">
          {i18next.t("ai-assist.action-label")}
        </label>
        {isPricesLoading ? (
          <div className="opacity-50">...</div>
        ) : (
          <div className="flex flex-col gap-2">
            {ACTIONS.map((action, i) => {
              const price = prices?.find((p) => p.action === action);
              const freeRemaining = price?.free_remaining ?? 0;

              return (
                <motion.button
                  type="button"
                  key={action}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  aria-pressed={selectedAction === action}
                  className={clsx(
                    "border px-4 py-3 rounded-lg cursor-pointer flex items-center justify-between text-left w-full",
                    selectedAction === action
                      ? "border-blue-dark-sky bg-blue-dark-sky/10"
                      : "border-[--border-color] hover:bg-gray-100 dark:hover:bg-gray-800"
                  )}
                  onClick={() => setSelectedAction(action)}
                >
                  <div>
                    <div className={clsx(
                      "text-sm font-medium",
                      selectedAction === action && "text-blue-dark-sky"
                    )}>
                      {i18next.t(`ai-assist.action-${action}`)}
                    </div>
                    <div className="text-xs opacity-50">
                      {i18next.t(`ai-assist.action-${action}-desc`)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs shrink-0 ml-2">
                    {freeRemaining > 0 && (
                      <span className="text-green-500 font-medium">
                        {i18next.t("ai-assist.free-remaining", { count: freeRemaining })}
                      </span>
                    )}
                    <span className="opacity-50">
                      {price?.cost ?? "?"} {i18next.t("ai-assist.points-unit")}
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {selectedAction && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
        >
          <label className="text-sm font-medium mb-1 block">
            {i18next.t("ai-assist.text-label")}
          </label>
          <FormControl
            type="textarea"
            value={text}
            onChange={(e: any) => setText(e.target.value.slice(0, maxInput))}
            placeholder={i18next.t("ai-assist.text-placeholder")}
            rows={6}
          />
          <div className="flex justify-between mt-1">
            <div className={clsx(
              "text-xs",
              text.length < minInput ? "text-red" : "opacity-50"
            )}>
              {text.length < minInput
                ? i18next.t("ai-assist.min-chars", { count: minInput })
                : i18next.t("ai-assist.chars-remaining", { count: charsRemaining })}
            </div>
          </div>
        </motion.div>
      )}

      {isInsufficientBalance && (
        <small className="text-red block">
          {i18next.t("ai-assist.error-insufficient-points", {
            required: selectedPrice?.cost ?? 0,
            available: activeUserPoints?.points ?? "0",
          })}
        </small>
      )}

      <div className="flex justify-end">
        <Button
          disabled={!canSubmit}
          isLoading={isProcessing}
          onClick={handleSubmit}
        >
          {isProcessing
            ? i18next.t("ai-assist.submitting")
            : i18next.t("ai-assist.submit-button")}
        </Button>
      </div>
    </div>
  );
}
