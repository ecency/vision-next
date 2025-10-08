"use client";

import { Modal, ModalBody, ModalHeader } from "@ui/modal";
import i18next from "i18next";
import { SentryIssueReporter } from "@/features/issue-reporter/sentry-issue-reporter";
import { Button } from "@ui/button";
import { useCallback, useState } from "react";

interface Props {
  error?: any;
}

export function SentryIssueReporterDialog({ error }: Props) {
  const [show, setShow] = useState(false);

  const onHide = useCallback(() => setShow(false), []);

  return (
    <>
      <Button appearance="link" onClick={() => setShow(true)}>
        {i18next.t("issue-reporter.report-issue")}
      </Button>
      <Modal centered={true} show={show} onHide={() => setShow(false)}>
        <ModalHeader closeButton={true}>{i18next.t("issue-reporter.report-issue")}</ModalHeader>
        <ModalBody>
          <SentryIssueReporter error={error} onHide={onHide} />
        </ModalBody>
      </Modal>
    </>
  );
}
