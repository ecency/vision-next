import { Modal, ModalBody, ModalFooter, ModalHeader } from "@ui/modal";
import i18next from "i18next";
import React from "react";
import { usePublishState } from "@/app/publish/_hooks";
import { Button } from "@ui/button";
import { Alert, Datepicker } from "@/features/ui";
import { addDays, setHours, setMinutes } from "date-fns";

interface Props {
  show: boolean;
  setShow: (show: boolean) => void;
}

export function PublishScheduleDialog({ show, setShow }: Props) {
  const { schedule, setSchedule, clearSchedule } = usePublishState();

  return (
    <Modal show={show} onHide={() => setShow(false)} centered={true}>
      <ModalHeader closeButton={true}>{i18next.t("submit.schedule")}</ModalHeader>
      <ModalBody>
        <Alert className="mb-4">{i18next.t("publish.schedule-hint")}</Alert>
        <Datepicker value={schedule} onChange={setSchedule} />
      </ModalBody>
      <ModalFooter className="justify-between flex gap-4">
        <Button
          appearance="link"
          onClick={() =>
            setSchedule(
              setMinutes(
                setHours(addDays(new Date(), 1), schedule?.getHours() ?? 0),
                schedule?.getMinutes() ?? 0
              )
            )
          }
          size="sm"
        >
          {i18next.t("g.tomorrow")}
        </Button>
        <Button appearance="gray" onClick={() => clearSchedule()} size="sm">
          {i18next.t("submit.clear")}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
