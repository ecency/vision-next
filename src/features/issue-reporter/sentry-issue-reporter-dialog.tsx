"use client";

import { Modal, ModalBody, ModalHeader } from "@ui/modal";
import i18next from "i18next";
import { SentryIssueReporter } from "@/features/issue-reporter/sentry-issue-reporter";
import { Button } from "@ui/button";
import { useState } from "react";

export function SentryIssueReporterDialog() {
  const [show, setShow] = useState(false);

  return (
    <>
      <Button appearance="link" onClick={() => setShow(true)}>
        {i18next.t("issue-reporter.report-issue")}
      </Button>
      <Modal centered={true} show={show} onHide={() => setShow(false)}>
        <ModalHeader closeButton={true}>{i18next.t("issue-reporter.report-issue")}</ModalHeader>
        <ModalBody>
          <SentryIssueReporter />
        </ModalBody>
      </Modal>
    </>
  );
}
