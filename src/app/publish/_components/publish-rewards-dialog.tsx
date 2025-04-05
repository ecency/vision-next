import { Modal, ModalBody, ModalFooter, ModalHeader } from "@ui/modal";
import i18next from "i18next";
import { FormControl } from "@ui/input";
import React from "react";
import { RewardType } from "@/entities";
import { usePublishState } from "@/app/publish/_hooks";
import { Button } from "@ui/button";
import { Alert } from "@ui/alert";

interface Props {
  show: boolean;
  setShow: (show: boolean) => void;
}

export function PublishRewardsDialog({ show, setShow }: Props) {
  const { reward, setReward } = usePublishState();

  return (
    <Modal show={show} onHide={() => setShow(false)} centered={true}>
      <ModalHeader closeButton={true}>{i18next.t("submit.reward")}</ModalHeader>
      <ModalBody>
        <Alert className="mb-4">{i18next.t("submit.reward-hint")}</Alert>
        <div>
          <FormControl
            type="select"
            value={reward}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              setReward(e.target.value as RewardType);
            }}
          >
            <option value="default">{i18next.t("submit.reward-default")}</option>
            <option value="sp">{i18next.t("submit.reward-sp")}</option>
            <option value="dp">{i18next.t("submit.reward-dp")}</option>
          </FormControl>
          <small className="text-gray-600 dark:text-gray-400">
            {i18next.t("submit.reward-hint")}
          </small>
        </div>
      </ModalBody>
      <ModalFooter className="justify-end flex">
        <Button appearance="gray" onClick={() => setShow(false)} size="sm">
          {i18next.t("g.close")}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
