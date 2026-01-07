import { Modal, ModalBody, ModalFooter, ModalHeader } from "@ui/modal";
import i18next from "i18next";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { usePublishState } from "@/app/publish/_hooks";
import { Button } from "@ui/button";
import { error } from "@/features/shared";
import { getAccountFullQueryOptions } from "@ecency/sdk";
import { Table, Td, Th, Tr } from "@ui/table";
import { FormControl, InputGroup } from "@ui/input";
import { handleInvalid, handleOnInput } from "@/utils";
import { deleteForeverSvg, plusSvg } from "@ui/svg";
import { Form } from "@ui/form";
import { useThreeSpeakManager } from "@/features/3speak";
import { Alert } from "@ui/alert";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { useQueryClient } from "@tanstack/react-query";

interface Props {
  show: boolean;
  setShow: (show: boolean) => void;
}

export function PublishBeneficiariesDialog({ show, setShow }: Props) {
  const formRef = useRef<HTMLFormElement | null>(null);

  const { activeUser } = useActiveAccount();
  const queryClient = useQueryClient();
  const { videos } = useThreeSpeakManager();

  const { beneficiaries, setBeneficiaries } = usePublishState();
  const [username, setUsername] = useState("");
  const [percentage, setPercentage] = useState(0);
  const [inProgress, setInProgress] = useState(false);

  const used = useMemo(
    () => beneficiaries?.reduce((a, b) => a + b.weight / 100, 0) ?? 0,
    [beneficiaries]
  );

  const submit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!formRef.current?.checkValidity()) {
        return;
      }

      if (beneficiaries?.find((x) => x.account === username) !== undefined) {
        error(i18next.t("beneficiary-editor.user-exists-error", { n: username }));
        return;
      }

      setInProgress(true);
      try {
        const r = await queryClient.fetchQuery(
          getAccountFullQueryOptions(username)
        );
        if (!r) {
          error(i18next.t("beneficiary-editor.user-error", { n: username }));
          return;
        }

        setBeneficiaries([
          ...(beneficiaries ?? []),
          {
            account: username,
            weight: Number(percentage) * 100
          }
        ]);

        setUsername("");
        setPercentage(0);
      } finally {
        setInProgress(false);
      }
    },
    [beneficiaries, percentage, setBeneficiaries, username]
  );

  return (
    <Modal show={show} onHide={() => setShow(false)} centered={true}>
      <ModalHeader closeButton={true}>{i18next.t("submit.beneficiaries")}</ModalHeader>
      <ModalBody>
        <Alert className="mb-4">{i18next.t("submit.beneficiaries-hint")}</Alert>
        <Form ref={formRef} onSubmit={submit}>
          <div className="beneficiary-list">
            <Table full={true}>
              <thead>
                <Tr>
                  <Th>{i18next.t("beneficiary-editor.username")}</Th>
                  <Th>{i18next.t("beneficiary-editor.reward")}</Th>
                  <Th />
                </Tr>
              </thead>
              <tbody>
                {activeUser?.username && 100 - used > 0 && (
                  <Tr>
                    <Td>{`@${activeUser?.username}`}</Td>
                    <Td>{`${100 - used}%`}</Td>
                    <Td />
                  </Tr>
                )}
                <Tr>
                  <Td>
                    <InputGroup prepend="@">
                      <FormControl
                        type="text"
                        disabled={inProgress}
                        autoFocus={true}
                        required={true}
                        minLength={3}
                        maxLength={20}
                        value={username}
                        onInvalid={(e: any) =>
                          handleInvalid(e, "beneficiary-editor.", "validation-username")
                        }
                        onInput={handleOnInput}
                        onChange={(e: { target: { value: string } }) =>
                          setUsername(e.target.value.trim().toLowerCase())
                        }
                      />
                    </InputGroup>
                  </Td>
                  <Td>
                    <InputGroup append="%">
                      <FormControl
                        disabled={inProgress}
                        required={true}
                        type="number"
                        min={1}
                        max={100 - used}
                        step={1}
                        value={percentage}
                        onChange={(e) => setPercentage(+e.target.value)}
                        onInvalid={(e: any) =>
                          handleInvalid(e, "beneficiary-editor.", "validation-percentage")
                        }
                        onInput={handleOnInput}
                      />
                    </InputGroup>
                  </Td>
                  <Td>
                    <Button
                      isLoading={inProgress}
                      disabled={inProgress || 100 - used < 1}
                      size="sm"
                      type="submit"
                      icon={plusSvg}
                    />
                  </Td>
                </Tr>
                {beneficiaries?.map((x) => (
                  <Tr key={x.account}>
                    <Td>{`@${x.account}`}</Td>
                    <Td>{`${x.weight / 100}%`}</Td>
                    <Td>
                      {Object.values(videos).length > 0 && x.src === "ENCODER_PAY" ? (
                        <></>
                      ) : (
                        <Button
                          onClick={() => {
                            setBeneficiaries(beneficiaries.filter((b) => b.account !== x.account));
                          }}
                          appearance="danger"
                          size="sm"
                          icon={deleteForeverSvg}
                        />
                      )}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Form>
      </ModalBody>
      <ModalFooter className="justify-end flex">
        <Button appearance="gray" onClick={() => setShow(false)} size="sm">
          {i18next.t("g.close")}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
