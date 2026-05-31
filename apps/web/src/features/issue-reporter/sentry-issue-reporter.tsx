"use client";

import { useActiveAccount } from "@/core/hooks/use-active-account";

import { useCallback, useState } from "react";
import * as Sentry from "@sentry/nextjs";
import { usePathname } from "next/navigation";
import { Form } from "@ui/form";
import { FormControl } from "@ui/input";
import i18next from "i18next";
import { Button } from "@ui/button";
import { success } from "@/features/shared";

interface Props {
  error?: any;
  // Event id of an exception already captured upstream (global-error
  // auto-capture). When set, feedback attaches to it instead of re-capturing.
  eventId?: string;
  onHide: () => void;
}

export function SentryIssueReporter({ error, eventId, onHide }: Props) {
  const { activeUser } = useActiveAccount();

  const pathname = usePathname();

  const [message, setMessage] = useState("");
  const [name, setName] = useState(activeUser?.username ?? "");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const submit = useCallback(() => {
    setIsLoading(true);
    if (activeUser) {
      Sentry.setUser({
        username: activeUser.username
      });
    }

    // Prefer the event already captured by the error boundary so the feedback
    // enriches that event rather than creating a duplicate; fall back to
    // capturing here when the dialog is used without a pre-captured event.
    const associatedEventId = eventId ?? Sentry.captureException(error);

    Sentry.captureFeedback({
      message,
      name,
      email,
      url: pathname ?? undefined,
      associatedEventId
    });

    setIsLoading(false);
    success(i18next.t("issue-reporter.issue-reported"));
    onHide();
  }, [activeUser, email, error, eventId, message, name, onHide, pathname]);

  return (
    <Form className="flex flex-col gap-4">
      <FormControl
        disabled={isLoading}
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={i18next.t("issue-reporter.name-placeholder")}
      />
      <FormControl
        disabled={isLoading}
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={i18next.t("issue-reporter.email-placeholder")}
      />
      <FormControl
        disabled={isLoading}
        type="textarea"
        value={message}
        onChange={(e: any) => setMessage(e.target.value)}
        placeholder={i18next.t("issue-reporter.message-placeholder")}
      />
      <Button disabled={!name || !message || isLoading} onClick={submit}>
        {i18next.t("issue-reporter.report")}
      </Button>
    </Form>
  );
}
