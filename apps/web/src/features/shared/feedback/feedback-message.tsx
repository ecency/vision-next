"use client";

import { useGlobalStore } from "@/core/global-store";
import { ErrorTypes } from "@/enums";
import {
  clearErrorFeedbackContext,
  consumeErrorFeedbackContext,
  ErrorFeedbackObject,
  FeedbackObject
} from "./feedback-events";
import { FeedbackModal } from "./feedback-modal";
import { UilCheckCircle, UilExclamationCircle, UilMultiply } from "@tooni/iconscout-unicons-react";
import { Button } from "@ui/button";
import clsx from "clsx";
import i18next from "i18next";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { useMount, useUnmount } from "react-use";
import * as Sentry from "@sentry/nextjs";
import { getConsoleHistory } from "@/utils/console-recorder";

interface Props {
  feedback: FeedbackObject;
  onClose: () => void;
}

export function FeedbackMessage({ feedback, onClose }: Props) {
  const timeoutRef = useRef<any>();
  const activeUser = useGlobalStore((s) => s.activeUser);

  const [showDialog, setShowDialog] = useState(false);
  const errorType = (feedback as ErrorFeedbackObject).errorType;

  const handleClose = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    clearErrorFeedbackContext(feedback.id);
    onClose();
  }, [feedback.id, onClose]);

  const initTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(handleClose, 5000);
  }, [handleClose]);

  useMount(() => initTimeout());
  useUnmount(() => clearErrorFeedbackContext(feedback.id));

  return (
    <div
      className={clsx("bg-white border border-[--border-color] pt-2 pb-3 text-sm rounded-xl")}
      onMouseEnter={() => clearTimeout(timeoutRef.current)}
      onMouseLeave={() => initTimeout()}
    >
      <div className="flex items-start gap-2 px-2">
        {feedback.type === "error" && <UilExclamationCircle className="w-6 h-6 text-red" />}
        {feedback.type === "success" && <UilCheckCircle className="w-6 h-6 text-green" />}
        <div className="w-full">
          <div className="flex justify-between items-center">
            <div
              className={clsx(
                "font-semibold",
                feedback.type === "success" && "text-green",
                feedback.type === "error" && "text-red",
                feedback.type === "info" && "text-blue-dark-sky"
              )}
            >
              {feedback.type === "success" && "Success"}
              {feedback.type === "error" &&
                (errorType === ErrorTypes.INSUFFICIENT_RESOURCE_CREDITS
                  ? i18next.t("feedback-modal.insufficient-resource-title")
                  : "Error")}
              {feedback.type === "info" && "Information"}
            </div>
            <Button
              className="!w-6 !h-6"
              icon={<UilMultiply className="!w-3" />}
              appearance="gray"
              onClick={handleClose}
            />
          </div>
          <div className="text-gray-600 dark:text-gray-400">{feedback.message}</div>
          {errorType === ErrorTypes.INSUFFICIENT_RESOURCE_CREDITS && (
            <div className="mt-2 flex flex-col gap-2">
              <Link
                href={`https://ecency.com/purchase?username=${activeUser?.username}&type=boost&product_id=999points`}
                target="_external"
              >
                <Button size="xs" appearance="gray">
                  {i18next.t("feedback-modal.insufficient-resource-buy")}
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {errorType && (
        <div className="flex justify-end px-3 border-t border-[--border-color] pt-2 items-center gap-2 mt-2">
          {errorType !== ErrorTypes.COMMON && errorType !== ErrorTypes.INFO && (
            <Button size="xs" appearance="gray-link" onClick={() => setShowDialog(true)}>
              {i18next.t("feedback-modal.question")}
            </Button>
          )}

          {errorType !== ErrorTypes.INFO && (
            <Button
              size="xs"
              appearance="gray"
              onClick={() => {
                if (timeoutRef.current) {
                  clearTimeout(timeoutRef.current);
                }

                const context = consumeErrorFeedbackContext(feedback.id);

                Sentry.withScope((scope) => {
                  scope.setExtra("feedbackId", feedback.id);
                  scope.setExtra("feedbackMessage", feedback.message);

                  if (context?.consoleHistory?.length) {
                    scope.setExtra("consoleHistory", context.consoleHistory);
                  } else {
                    const history = getConsoleHistory();
                    if (history.length) {
                      scope.setExtra("consoleHistory", history);
                    }
                  }

                  if (context?.contextTag) {
                    scope.setTag("context", context.contextTag);
                  }

                  scope.setTag("reported_via", "feedback-toast-report");

                  const errorPayload = context?.error ?? new Error(feedback.message);
                  Sentry.captureException(errorPayload);
                });

                handleClose();
              }}
            >
              {i18next.t("feedback-modal.report")}
            </Button>
          )}
        </div>
      )}

      <FeedbackModal
        instance={feedback as ErrorFeedbackObject}
        show={showDialog}
        setShow={(v) => setShowDialog(v)}
      />
    </div>
  );
}
