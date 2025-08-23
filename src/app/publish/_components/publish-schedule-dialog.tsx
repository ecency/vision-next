import { usePublishState } from "@/app/publish/_hooks";
import { Alert, Datepicker } from "@/features/ui";
import { Button } from "@ui/button";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "@ui/modal";
import dayjs from "@/utils/dayjs";
import i18next from "i18next";
import { useMemo, useState } from "react";

interface Props {
  show: boolean;
  setShow: (show: boolean) => void;
}

export function PublishScheduleDialog({ show, setShow }: Props) {
  const { schedule, setSchedule, clearSchedule } = usePublishState();

  const [state, setState] = useState(schedule);

  const isInPast = useMemo(
    () => (state ? dayjs(state).isSameOrBefore(dayjs().add(1, "hour")) : false),
    [state]
  );

  return (
    <Modal show={show} onHide={() => setShow(false)} centered={true}>
      <ModalHeader closeButton={true}>{i18next.t("submit.schedule")}</ModalHeader>
      <ModalBody>
        <Alert className="mb-4">{i18next.t("publish.schedule-hint")}</Alert>
        <div className="p-2 md:p-4 border border-[--border-color] rounded-xl">
          <Datepicker
            value={state}
            onChange={setState}
            minDate={dayjs().add(1, "hour").toDate()}
          />
        </div>
        <div className="py-4">
          {state && i18next.t("publish.schedule-to", { n: dayjs(state).format("DD/MM/YYYY HH:mm") })}
          {!state && i18next.t("publish.no-schedule")}
        </div>
        {isInPast && <Alert appearance="danger">{i18next.t("publish.schedule-error")}</Alert>}
      </ModalBody>
      <ModalFooter className="justify-between flex gap-4">
        <Button
          className="!w-full sm:!w-auto"
          appearance="gray"
          onClick={() => setState(undefined)}
          size="sm"
        >
          {i18next.t("submit.clear")}
        </Button>
        <Button
          className="!w-full sm:!w-auto"
          appearance="success"
          disabled={isInPast}
          onClick={() => {
            if (!isInPast) {
              setSchedule(state);
              setShow(false);
            }
          }}
          size="sm"
        >
          {i18next.t("g.done")}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
