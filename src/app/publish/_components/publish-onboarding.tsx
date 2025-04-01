"use client";

import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from "@/features/ui";
import { PREFIX } from "@/utils/local-storage";
import { useLocalStorage } from "react-use";
import Image from "next/image";
import {
  UilDocumentInfo,
  UilEdit,
  UilFocus,
  UilGrid,
  UilWindow
} from "@tooni/iconscout-unicons-react";
import i18next from "i18next";

const featuresList = [
  {
    title: i18next.t("publish.get-started.single-view-title"),
    description: i18next.t("publish.get-started.single-view-description"),
    icon: <UilWindow className="opacity-50" />
  },
  {
    title: i18next.t("publish.get-started.dynamic-editor-title"),
    description: i18next.t("publish.get-started.dynamic-editor-description"),
    icon: <UilEdit className="opacity-50" />
  },
  {
    title: i18next.t("publish.get-started.focus-title"),
    description: i18next.t("publish.get-started.focus-description"),
    icon: <UilFocus className="opacity-50" />
  }
];

export function PublishOnboarding() {
  const [show, setShow] = useLocalStorage(PREFIX + "_pub_onboarding_passed", true);

  return (
    <Modal centered={true} show={show!} onHide={() => setShow(false)}>
      <ModalHeader closeButton={true} />
      <ModalBody>
        <div className="mx-auto flex flex-col gap-6 lg:gap-12 p-4">
          <div className="text-2xl font-bold text-center">
            {i18next.t("publish.get-started.title")}
          </div>
          <div className="flex flex-col gap-6 lg:gap-8">
            {featuresList.map(({ title, icon, description }, i) => (
              <div
                className="grid gap-4"
                key={i}
                style={{
                  gridTemplateColumns: "max-content 1fr"
                }}
              >
                {icon}
                <div className="-mt-2">
                  <div className="font-bold">{title}</div>
                  <div className="opacity-75">{description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ModalBody>
      <ModalFooter className="justify-center gap-4 flex p-4">
        <Button onClick={() => setShow(false)}>{i18next.t("publish.get-started.button")}</Button>
      </ModalFooter>
    </Modal>
  );
}
