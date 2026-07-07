import { isThreeSpeakBeneficiary } from "@/api/threespeak-embed";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "@ui/modal";
import i18next from "i18next";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePublishState } from "@/app/publish/_hooks";
import { Button } from "@ui/button";
import { error } from "@/features/shared";
import { getAccountFullQueryOptions } from "@ecency/sdk";
import { Table, Td, Th, Tr } from "@ui/table";
import { FormControl, InputGroup } from "@ui/input";
import { handleInvalid, handleOnInput } from "@/utils";
import { deleteForeverSvg, plusSvg } from "@ui/svg";
import { Form } from "@ui/form";
import { Alert } from "@ui/alert";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { useQueryClient } from "@tanstack/react-query";
import { StyledTooltip } from "@/features/ui";
import {
  canFitBeneficiary,
  SUPPORT_ECENCY_ACCOUNT,
  SUPPORT_ECENCY_BENEFICIARY_PRESETS,
  SUPPORT_ECENCY_DEFAULT_PERCENT,
  useSupportEcencySettingsQuery,
  useSupportEcencySettingsUpdate
} from "@/features/support-ecency";

interface Props {
  show: boolean;
  setShow: (show: boolean) => void;
}

export function PublishBeneficiariesDialog({ show, setShow }: Props) {
  const formRef = useRef<HTMLFormElement | null>(null);

  const { activeUser } = useActiveAccount();
  const queryClient = useQueryClient();

  const { beneficiaries, setBeneficiaries, hasThreeSpeakVideo } = usePublishState();
  const [username, setUsername] = useState("");
  const [percentage, setPercentage] = useState(0);
  const [inProgress, setInProgress] = useState(false);

  const used = useMemo(
    () => beneficiaries?.reduce((a, b) => a + b.weight / 100, 0) ?? 0,
    [beneficiaries]
  );

  // Support Ecency preference (a voluntary beneficiary percent stored on the
  // user's Ecency settings). Toggling it here both persists the preference and
  // applies/removes the ecency row on the current post.
  const { data: supportSettings } = useSupportEcencySettingsQuery();
  const { mutateAsync: updateSupportSettings, isPending: isSupportSaving } =
    useSupportEcencySettingsUpdate();
  const savedSupportPercent = supportSettings?.beneficiary_percent ?? 0;
  const supportEnabled = savedSupportPercent > 0;
  const [supportPercent, setSupportPercent] = useState(SUPPORT_ECENCY_DEFAULT_PERCENT);

  // Every update carries BOTH percents, so writing before the stored settings
  // are known (still loading, fetch failed) would silently zero the curation
  // holdback. Keep the controls disabled and refuse writes until then.
  const supportControlsDisabled = isSupportSaving || !supportSettings;

  useEffect(() => {
    if (savedSupportPercent > 0) {
      setSupportPercent(savedSupportPercent);
    }
  }, [savedSupportPercent]);

  const persistSupportPercent = useCallback(
    async (percent: number) => {
      if (!supportSettings) {
        return false;
      }
      try {
        // Only the beneficiary percent is managed here; keep the stored
        // curation holdback untouched by sending its current value.
        await updateSupportSettings({
          beneficiary_percent: percent,
          curation_percent: supportSettings.curation_percent
        });
        return true;
      } catch (e) {
        error(i18next.t("g.server-error"));
        return false;
      }
    },
    [supportSettings, updateSupportSettings]
  );

  const applySupportRow = useCallback(
    (percent: number) => {
      const weight = percent * 100;
      const rest = beneficiaries?.filter((b) => b.account !== SUPPORT_ECENCY_ACCOUNT) ?? [];
      if (!canFitBeneficiary(rest, weight)) {
        error(i18next.t("support-ecency.limits-reached"));
        return;
      }
      setBeneficiaries([...rest, { account: SUPPORT_ECENCY_ACCOUNT, weight }]);
    },
    [beneficiaries, setBeneficiaries]
  );

  const toggleSupport = useCallback(
    async (enabled: boolean) => {
      const ok = await persistSupportPercent(enabled ? supportPercent : 0);
      if (!ok) {
        return;
      }
      if (enabled) {
        applySupportRow(supportPercent);
      } else {
        setBeneficiaries(
          beneficiaries?.filter((b) => b.account !== SUPPORT_ECENCY_ACCOUNT) ?? []
        );
      }
    },
    [applySupportRow, beneficiaries, persistSupportPercent, setBeneficiaries, supportPercent]
  );

  const supportPercentChanged = useCallback(
    async (e: React.ChangeEvent<HTMLSelectElement>) => {
      const percent = +e.target.value;
      setSupportPercent(percent);
      if (supportEnabled) {
        const ok = await persistSupportPercent(percent);
        if (ok) {
          applySupportRow(percent);
        }
      }
    },
    [applySupportRow, persistSupportPercent, supportEnabled]
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
        {activeUser?.username && activeUser.username !== SUPPORT_ECENCY_ACCOUNT && (
          <div className="mb-4 p-3 rounded-xl border border-[--border-color] flex flex-col gap-2">
            <div className="flex items-center justify-between gap-4">
              <FormControl
                type="checkbox"
                isToggle={true}
                id="support-ecency-toggle"
                label={i18next.t("support-ecency.title")}
                checked={supportEnabled}
                disabled={supportControlsDisabled}
                onChange={(v: boolean) => toggleSupport(v)}
              />
              <div className="w-24 shrink-0">
                <FormControl
                  type="select"
                  size="sm"
                  value={supportPercent}
                  disabled={supportControlsDisabled}
                  onChange={supportPercentChanged}
                  aria-label={i18next.t("support-ecency.percent-label")}
                >
                  {SUPPORT_ECENCY_BENEFICIARY_PRESETS.map((p) => (
                    <option key={p} value={p}>
                      {p}%
                    </option>
                  ))}
                </FormControl>
              </div>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {i18next.t("support-ecency.beneficiary-dialog-hint")}
            </div>
          </div>
        )}
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
                      aria-label={i18next.t("beneficiary-editor.add", { defaultValue: "Add beneficiary" })}
                    />
                  </Td>
                </Tr>
                {beneficiaries?.map((x) => {
                  const isLocked =
                    hasThreeSpeakVideo && isThreeSpeakBeneficiary(x.account);
                  return (
                    <Tr key={x.account}>
                      <Td>{`@${x.account}`}</Td>
                      <Td>{`${x.weight / 100}%`}</Td>
                      <Td>
                        {isLocked ? (
                          <StyledTooltip
                            content={i18next.t(
                              "beneficiary-editor.threespeak-locked"
                            )}
                          >
                            <span className="text-gray-400 text-xs">
                              {i18next.t("beneficiary-editor.required")}
                            </span>
                          </StyledTooltip>
                        ) : (
                          <Button
                            onClick={() => {
                              setBeneficiaries(
                                beneficiaries.filter(
                                  (b) => b.account !== x.account
                                )
                              );
                            }}
                            appearance="danger"
                            size="sm"
                            icon={deleteForeverSvg}
                            aria-label={i18next.t("g.delete", { defaultValue: "Delete" })}
                          />
                        )}
                      </Td>
                    </Tr>
                  );
                })}
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
