import React, { useState } from "react";
import Datetime from "react-datetime";
import dayjs, { Dayjs } from "@/utils/dayjs";
import "./_index.scss";
import { Modal, ModalBody, ModalHeader, ModalTitle } from "@ui/modal";
import { Button } from "@ui/button";
import i18next from "i18next";
import { closeSvg, timeSvg } from "@ui/svg";

interface Props {
  date: Dayjs | null;
  onChange: (date: Dayjs | null) => void;
}

interface DialogBodyProps extends Props {
  onHide: () => void;
}

export const DialogBody = (props: DialogBodyProps) => {
  const [date, setDate] = useState<Dayjs>(
    props.date || dayjs().add(2, "hour")
  );
  const [error, setError] = useState(false);
  const todayTs = dayjs().hour(0).minute(0).second(0).millisecond(0).format("x");

  const rend = () => {
    return (
      <>
        <div className="picker">
          <Datetime
            open={true}
            input={false}
            initialValue={date}
            timeFormat="HH:mm"
            isValidDate={(d) => {
              return d.format("x") >= todayTs;
            }}
            onChange={(date) => {
              if ((date as Dayjs).format("x") <= dayjs().format("x")) {
                setError(true);
              } else {
                setError(false);
                setDate(date as Dayjs);
              }
            }}
          />
        </div>
        {error && (
          <div className="error">
            <small className="error-info">{i18next.t("post-scheduler.error-message")}</small>
          </div>
        )}
        <div className="text-center mt-4">
          <Button
            disabled={error}
            onClick={() => {
              if (error) {
                return;
              }
              const { onChange, onHide } = props;
              onChange(date);
              onHide();
            }}
          >
            {i18next.t("g.apply")}
          </Button>
        </div>
      </>
    );
  };

  return rend();
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
