"use client";

import { ErrorTypes } from "@/enums";
import { ErrorFeedbackObject, FeedbackModal, FeedbackObject } from "@/features/shared";
import { UilCheckCircle, UilExclamationCircle, UilMultiply } from "@tooni/iconscout-unicons-react";
import { Button } from "@ui/button";
import clsx from "clsx";
import i18next from "i18next";
import { useCallback, useRef, useState } from "react";
import { useMount } from "react-use";

interface Props {
  feedback: FeedbackObject;
  onClose: () => void;
}

export function FeedbackMessage({ feedback, onClose }: Props) {
  const timeoutRef = useRef<any>();

  const [showDialog, setShowDialog] = useState(false);
  const errorType = (feedback as ErrorFeedbackObject).errorType;

  const initTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(onClose, 5000);
  }, []);

  useMount(() => initTimeout());

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
              {feedback.type === "error" && "Error"}
              {feedback.type === "info" && "Information"}
            </div>
            <Button
              className="!w-6 !h-6"
              icon={<UilMultiply className="!w-3" />}
              appearance="gray"
              onClick={onClose}
            />
          </div>
          <div className="text-gray-600 dark:text-gray-400">{feedback.message}</div>
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
              onClick={() =>
                window.open(
                  "mailto:bug@ecency.com?Subject=Reporting issue&Body=Hello team, \n I would like to report issue: \n",
                  "_blank"
                )
              }
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
