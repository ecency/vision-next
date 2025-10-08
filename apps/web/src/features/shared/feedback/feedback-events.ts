import { ErrorTypes } from "@/enums";
import { random } from "@/utils";
import i18next from "i18next";
import * as Sentry from "@sentry/nextjs";
import { formatError } from "@/api/operations";

export const error = (message: string, errorType = ErrorTypes.COMMON) => {
  const detail: ErrorFeedbackObject = {
    id: random(),
    type: "error",
    message,
    errorType
  };

  if (message.includes("Please wait to transact")) {
    detail.errorType = ErrorTypes.INSUFFICIENT_RESOURCE_CREDITS;
    detail.message = i18next.t("feedback-modal.insufficient-resource-message");
  }

  const ev = new CustomEvent("ecency-feedback", { detail });
  window.dispatchEvent(ev);
};

export const success = (message: string) => {
  const detail: FeedbackObject = {
    id: random(),
    type: "success",
    message
  };
  const ev = new CustomEvent("ecency-feedback", { detail });
  window.dispatchEvent(ev);
};

export const info = (message: string) => {
  const detail: FeedbackObject = {
    id: random(),
    type: "info",
    message
  };
  const ev = new CustomEvent("ecency-feedback", { detail });
  window.dispatchEvent(ev);
};

type FeedbackType = "error" | "success" | "info";

export interface FeedbackObject {
  id: string;
  type: FeedbackType;
  message: string;
}

export interface ErrorFeedbackObject extends FeedbackObject {
  errorType: ErrorTypes;
}

/**
 * Handles known app errors and conditionally reports to Sentry.
 * @returns true if error was handled and should NOT be rethrown.
 */
export function handleAndReportError(err: any, contextTag?: string): boolean {
  const [message, type] = formatError(err);

  // Suppress known handled cases
  const suppressedTypes = [
    ErrorTypes.INSUFFICIENT_RESOURCE_CREDITS,
    ErrorTypes.COMMON,
    ErrorTypes.INFO
  ];

  if (suppressedTypes.includes(type)) {
    return true; // ✅ already handled
  }

  // Show modal
  error(message, type);

  if (contextTag) {
    Sentry.setTag("context", contextTag);
  }

  Sentry.captureException(err);
  return false; // ❌ unexpected, should throw
}

