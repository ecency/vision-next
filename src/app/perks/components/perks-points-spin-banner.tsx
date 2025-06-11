"use client";

import { PointsSpin, SPIN_VALUES } from "@/features/points";
import { Button, Modal, ModalBody, ModalFooter, ModalHeader, StyledTooltip } from "@/features/ui";
import { UilMoneyStack, UilSpin } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import Image from "next/image";
import { useState } from "react";
import { PerksBasicCard } from "./perks-basic-card";

export function PerksPointsSpinBanner() {
  const [showSpinner, setShowSpinner] = useState(false);

  return (
    <>
      <PerksBasicCard
        className="p-4 flex flex-col md:flex-row items-center gap-4 md:hover:!rotate-0 cursor-pointer"
        onClick={() => setShowSpinner(true)}
      >
        <Image src="/assets/undraw-gifts.svg" width={240} height={120} alt="" />
        <div className="flex flex-col gap-4 md:gap-6">
          <div>
            <div className="md:text-lg font-bold">{i18next.t("perks.spin-title")}</div>
            <div className="text-sm md:text-base text-gray-600 dark:text-gray-400">
              {i18next.t("perks.spin-description")}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button size="lg" icon={<UilMoneyStack />}>
              {i18next.t("perks.spin-now")}
            </Button>
            <StyledTooltip content="Available soon">
              <Button appearance="gray" size="lg" disabled={true}>
                {i18next.t("perks.want-more-spins")}
              </Button>
            </StyledTooltip>
          </div>
        </div>
      </PerksBasicCard>
      <Modal centered={true} show={showSpinner} onHide={() => setShowSpinner(false)}>
        <ModalHeader closeButton={true}>
          <div>
            Spin and <span className="text-blue-dark-sky">Win!</span>
          </div>
        </ModalHeader>
        <ModalBody className="flex flex-col items-center gap-4 md:gap-8 justify-center">
          <PointsSpin
            startSpin={true}
            options={SPIN_VALUES}
            onSpinComplete={() => {}}
            destination={undefined}
          />
        </ModalBody>
        <ModalFooter className="flex justify-between items-center">
          <div>3 spins left</div>
          <Button appearance="success" size="lg" icon={<UilSpin />}>
            Spin now
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}
