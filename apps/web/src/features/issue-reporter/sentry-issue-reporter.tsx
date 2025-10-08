"use client";

import { useCallback, useState } from "react";
import * as Sentry from "@sentry/nextjs";
import { useGlobalStore } from "@/core/global-store";
import { usePathname } from "next/navigation";
import { Form } from "@ui/form";
import { FormControl } from "@ui/input";
import i18next from "i18next";
import { Button } from "@ui/button";
import { success } from "@/features/shared";

interface Props {
  error?: any;
  onHide: () => void;
}

export function SentryIssueReporter({ error, onHide }: Props) {
  const activeUser = useGlobalStore((s) => s.activeUser);

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

    const eventId = Sentry.captureException(error);

    Sentry.captureFeedback({
      message,
      name,
      email,
      url: pathname ?? undefined,
      associatedEventId: eventId
    });

    setIsLoading(false);
    success(i18next.t("issue-reporter.issue-reported"));
    onHide();
  }, [activeUser, email, error, message, name, onHide, pathname]);

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
