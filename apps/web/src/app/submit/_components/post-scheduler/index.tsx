import React, { useState } from "react";
import dayjs, { Dayjs } from "@/utils/dayjs";
import "./_index.scss";
import { Modal, ModalBody, ModalHeader, ModalTitle } from "@ui/modal";
import { Button } from "@ui/button";
import { Datepicker } from "@/features/ui";
import i18next from "i18next";
import { closeSvg, timeSvg } from "@ui/svg";

interface Props {
  date: Dayjs | null;
  onChange: (date: Dayjs | null) => void;
}

interface DialogBodyProps extends Props {
  onHide: () => void;
}

export const DialogBody = ({ date: initialDate, onChange, onHide }: DialogBodyProps) => {
  const [date, setDate] = useState<Date | undefined>(initialDate?.toDate());
  const isInPast = date ? dayjs(date).isSameOrBefore(dayjs().add(1, "hour")) : false;

  return (
    <>
      <div className="picker">
        <Datepicker
          value={date}
          onChange={setDate}
          minDate={dayjs().add(1, "hour").toDate()}
        />
      </div>
      {isInPast && (
        <div className="error">
          <small className="error-info">{i18next.t("post-scheduler.error-message")}</small>
        </div>
      )}
      <div className="text-center mt-4">
        <Button
          disabled={isInPast}
          onClick={() => {
            if (!isInPast) {
              onChange(date ? dayjs(date) : null);
              onHide();
            }
          }}
        >
          {i18next.t("g.apply")}
        </Button>
      </div>
    </>
  );
};

export const PostSchedulerDialog = (props: Props) => {
  const [visible, setVisible] = useState<boolean>(false);
  const toggle = () => {
    setVisible((visible) => !visible);
  };

  const reset = () => {
    props.onChange(null);
  };

  return (
    <>
      {props.date ? (
        <div className="post-scheduler-scheduled">
          <span className="date" onClick={toggle}>
            {props.date.format("YYYY-MM-DD HH:mm")}
          </span>
          <span className="reset-date" onClick={reset}>
            {closeSvg}
          </span>
        </div>
      ) : (
        <Button className="inline-flex items-center" size="sm" onClick={toggle} icon={timeSvg}>
          {i18next.t("post-scheduler.btn-label")}
        </Button>
      )}
      {visible && (
        <Modal onHide={toggle} show={true} centered={true} className="post-scheduler-dialog">
          <ModalHeader closeButton={true}>
            <ModalTitle>{i18next.t("post-scheduler.title")}</ModalTitle>
          </ModalHeader>
          <ModalBody>
            <DialogBody {...props} onHide={toggle} />
          </ModalBody>
        </Modal>
      )}
    </>
  );
};
