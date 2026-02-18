"use client";

import { useActiveAccount } from "@/core/hooks/use-active-account";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import numeral from "numeral";
import { Button } from "@ui/button";
import { Popover, PopoverContent } from "@/features/ui";
import { Form } from "@ui/form";
import { FormControl } from "@ui/input";
import { Datepicker } from "@/features/ui";
import { LinearProgress, error, success } from "@/features/shared";
import { Tsx } from "@/features/i18n/helper";
import i18next from "i18next";
import clsx from "clsx";
import dayjs from "@/utils/dayjs";
import { useGlobalStore } from "@/core/global-store";
import { useProposalCreateMutation } from "@/api/sdk-mutations";
import { getAccountPostsQueryOptions } from "@ecency/sdk";
import { checkAllSvg } from "@ui/svg";
import { ProfileFilter } from "@/enums";

const PERMLINK_REGEX = /^[a-z0-9-]+$/;
const USERNAME_REGEX = /^[a-z0-9-\.]{3,16}$/;

const formatDisplayAmount = (value: number) =>
  numeral(value).format(value >= 1000 ? "0,0.00" : "0,0.000");

const buildDefaultDates = () => {
  const start = dayjs().add(1, "day").startOf("hour");
  return {
    start: start.toDate(),
    end: start.add(30, "day").toDate()
  };
};

export function ProposalCreateForm() {
  const { activeUser } = useActiveAccount();
  const toggleUiProp = useGlobalStore((s) => s.toggleUiProp);
  const queryClient = useQueryClient();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [subject, setSubject] = useState("");
  const [permlink, setPermlink] = useState("");
  const [receiver, setReceiver] = useState(activeUser?.username ?? "");
  const [startDate, setStartDate] = useState<Date | undefined>(() => buildDefaultDates().start);
  const [endDate, setEndDate] = useState<Date | undefined>(() => buildDefaultDates().end);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showPermlinkSuggestions, setShowPermlinkSuggestions] = useState(false);
  const [permlinkSuggestions, setPermlinkSuggestions] = useState<
    { title: string; permlink: string }[]
  >([]);
  const [permlinkSuggestionsLoading, setPermlinkSuggestionsLoading] = useState(false);
  const [permlinkSuggestionsLoaded, setPermlinkSuggestionsLoaded] = useState(false);
  const [permlinkSuggestionsError, setPermlinkSuggestionsError] = useState(false);
  const [dailyPay, setDailyPay] = useState("50");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { mutateAsync, isPending } = useProposalCreateMutation();
  const permlinkInputRef = useRef<HTMLInputElement | null>(null);
  const permlinkBlurTimeout = useRef<number | null>(null);
  const isAuthenticated = !!activeUser;

  useEffect(() => {
    if (activeUser && !receiver) {
      setReceiver(activeUser.username);
    }
  }, [activeUser, receiver]);

  const loadPermlinkSuggestions = useCallback(async () => {
    if (!activeUser?.username) {
      return;
    }

    setPermlinkSuggestionsLoading(true);
    setPermlinkSuggestionsError(false);

    try {
      const items = await queryClient.fetchQuery(
        getAccountPostsQueryOptions(
          activeUser.username,
          ProfileFilter.posts,
          "",
          "",
          20,
          activeUser.username
        )
      );

      const mapped = (items ?? [])
        .filter((entry) => typeof entry?.permlink === "string" && entry.permlink)
        .map((entry) => ({
          title: entry.title ?? "",
          permlink: entry.permlink.toLowerCase()
        }));

      setPermlinkSuggestions(mapped);
      setPermlinkSuggestionsLoaded(true);
    } catch (e) {
      setPermlinkSuggestionsError(true);
      setPermlinkSuggestions([]);
      setPermlinkSuggestionsLoaded(false);
    } finally {
      setPermlinkSuggestionsLoading(false);
    }
  }, [activeUser?.username, queryClient]);

  useEffect(() => {
    if (showPermlinkSuggestions && !permlinkSuggestionsLoaded) {
      void loadPermlinkSuggestions();
    }
  }, [loadPermlinkSuggestions, permlinkSuggestionsLoaded, showPermlinkSuggestions]);

  useEffect(() => {
    setPermlinkSuggestions([]);
    setPermlinkSuggestionsLoaded(false);
    setPermlinkSuggestionsError(false);
    setShowPermlinkSuggestions(false);
  }, [activeUser?.username]);

  useEffect(() => {
    if (!isAuthenticated || isPending || step !== 1) {
      setShowPermlinkSuggestions(false);
    }
  }, [isPending, isAuthenticated, step]);

  useEffect(() => () => {
    if (permlinkBlurTimeout.current) {
      window.clearTimeout(permlinkBlurTimeout.current);
      permlinkBlurTimeout.current = null;
    }
  }, []);

  const dailyPayNumber = useMemo(() => parseFloat(dailyPay) || 0, [dailyPay]);

  const durationDays = useMemo(() => {
    if (!startDate || !endDate) {
      return 0;
    }

    const diff = dayjs(endDate).diff(dayjs(startDate), "day", true);
    return diff > 0 ? diff : 0;
  }, [startDate, endDate]);

  const durationRounded = useMemo(() => Math.ceil(durationDays), [durationDays]);
  const durationFloored = useMemo(() => Math.floor(durationDays), [durationDays]);

  const totalPayout = useMemo(
    () => Math.max(0, durationRounded) * Math.max(0, dailyPayNumber),
    [durationRounded, dailyPayNumber]
  );

  const creationFee = useMemo(
    () => 10 + Math.max(0, durationFloored - 60),
    [durationFloored]
  );

  const startDateDisplay = useMemo(
    () =>
      startDate
        ? dayjs(startDate).format("YYYY-MM-DD HH:mm")
        : i18next.t("proposals.create.start-placeholder"),
    [startDate]
  );

  const endDateDisplay = useMemo(
    () =>
      endDate
        ? dayjs(endDate).format("YYYY-MM-DD HH:mm")
        : i18next.t("proposals.create.end-placeholder"),
    [endDate]
  );

  const resetForm = useCallback(() => {
    const dates = buildDefaultDates();
    setStep(1);
    setSubject("");
    setPermlink("");
    setShowPermlinkSuggestions(false);
    setReceiver(activeUser?.username ?? "");
    setStartDate(dates.start);
    setEndDate(dates.end);
    setShowStartPicker(false);
    setShowEndPicker(false);
    setDailyPay("50");
    setErrors({});
  }, [activeUser?.username]);

  const buildPayload = useCallback(() => {
    if (!startDate || !endDate) {
      return null;
    }

    return {
      receiver: receiver.trim(),
      subject: subject.trim(),
      permlink: permlink.trim(),
      start: dayjs(startDate).utc().format("YYYY-MM-DDTHH:mm:ss"),
      end: dayjs(endDate).utc().format("YYYY-MM-DDTHH:mm:ss"),
      dailyPay: `${Math.max(0, dailyPayNumber).toFixed(3)} HBD`
    };
  }, [dailyPayNumber, endDate, permlink, receiver, startDate, subject]);

  const validateStep = useCallback(() => {
    const validationErrors: Record<string, string> = {};

    const trimmedSubject = subject.trim();
    if (trimmedSubject.length < 3 || trimmedSubject.length > 80) {
      validationErrors.subject = i18next.t("proposals.create.subject-error");
    }

    const trimmedPermlink = permlink.trim();
    if (!trimmedPermlink || !PERMLINK_REGEX.test(trimmedPermlink)) {
      validationErrors.permlink = i18next.t("proposals.create.permlink-error");
    }

    const trimmedReceiver = receiver.trim();
    if (!trimmedReceiver || !USERNAME_REGEX.test(trimmedReceiver)) {
      validationErrors.receiver = i18next.t("proposals.create.receiver-error");
    }

    if (!startDate || dayjs(startDate).isBefore(dayjs().add(1, "hour"))) {
      validationErrors.startDate = i18next.t("proposals.create.start-error");
    }

    if (!endDate || !startDate || !dayjs(endDate).isAfter(startDate)) {
      validationErrors.endDate = i18next.t("proposals.create.end-error");
    }

    if (dailyPayNumber <= 0) {
      validationErrors.dailyPay = i18next.t("proposals.create.daily-pay-error");
    }

    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  }, [dailyPayNumber, endDate, permlink, receiver, startDate, subject]);

  const handleContinue = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (!activeUser) {
        toggleUiProp("login");
        return;
      }

      if (!validateStep()) {
        return;
      }

      setStep(2);
    },
    [activeUser, toggleUiProp, validateStep]
  );

  const handleSign = useCallback(async () => {
    if (!activeUser) {
      toggleUiProp("login");
      return;
    }

    const payload = buildPayload();
    if (!payload) {
      return;
    }

    try {
      await mutateAsync(payload);
      success(i18next.t("proposals.create.success-toast"));
      setStep(3);
    } catch (err) {
      error(i18next.t("g.server-error"));
    }
  }, [activeUser, buildPayload, mutateAsync, toggleUiProp]);

  const summaryItems = useMemo(
    () => [
      {
        label: i18next.t("proposals.create.summary-duration", {
          days: Math.max(0, durationRounded)
        }),
        value: ""
      },
      {
        label: i18next.t("proposals.create.summary-daily-pay", {
          amount: formatDisplayAmount(Math.max(0, dailyPayNumber))
        }),
        value: ""
      },
      {
        label: i18next.t("proposals.create.summary-total-pay", {
          amount: formatDisplayAmount(totalPayout)
        }),
        value: ""
      },
      {
        label: i18next.t("proposals.create.summary-creation-fee", {
          fee: formatDisplayAmount(creationFee)
        }),
        value: ""
      }
    ],
    [creationFee, dailyPayNumber, durationRounded, totalPayout]
  );

  return (
    <div className="proposal-create w-full mb-10">
      {step === 1 && (
        <div
          className={clsx(
            "transaction-form rounded-2xl border border-[--border-color] bg-white dark:bg-dark-default shadow-sm",
            isPending && "in-progress"
          )}
        >
          <div className="transaction-form-header px-6 py-5">
            <div className="step-no">1</div>
            <div className="box-titles">
              <div className="main-title">{i18next.t("proposals.create.step-setup-title")}</div>
              <div className="sub-title">
                {i18next.t("proposals.create.step-setup-sub-title")}
              </div>
            </div>
          </div>
          {isPending && <LinearProgress />}
          <div className="transaction-form-body px-6 py-6">
            <div className="mb-6 text-sm text-gray-600 dark:text-gray-400">
              <Tsx k="proposals.create.description">
                <div />
              </Tsx>
            </div>
            <Form className="flex flex-col gap-6" onSubmit={handleContinue}>
              <div>
                <label className="font-medium text-sm text-gray-700 dark:text-gray-200">
                  {i18next.t("proposals.create.subject-label")}
                </label>
                <FormControl
                  type="text"
                  maxLength={80}
                  value={subject}
                  onChange={(e) => setSubject((e.target as HTMLInputElement).value)}
                  disabled={!isAuthenticated || isPending}
                  className={clsx(errors.subject && "is-invalid")}
                  placeholder={i18next.t("proposals.create.subject-placeholder")}
                />
                {errors.subject && (
                  <p className="text-xs text-red mt-1">{errors.subject}</p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  {i18next.t("proposals.create.subject-help")}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <div>
                  <label className="font-medium text-sm text-gray-700 dark:text-gray-200">
                    {i18next.t("proposals.create.permlink-label")}
                  </label>
                  <Popover
                    className="w-full"
                    placement="bottom-start"
                    show={showPermlinkSuggestions && isAuthenticated && !isPending}
                    setShow={(next) => {
                      setShowPermlinkSuggestions(next && isAuthenticated && !isPending);
                    }}
                    customClassName="bg-white dark:bg-dark-default border border-[--border-color] rounded-xl shadow-lg"
                    behavior="click"
                    directContent={
                      <FormControl
                        ref={permlinkInputRef}
                        type="text"
                        value={permlink}
                        onFocus={() => {
                          if (!isAuthenticated || isPending) {
                            return;
                          }

                          if (permlinkBlurTimeout.current) {
                            window.clearTimeout(permlinkBlurTimeout.current);
                            permlinkBlurTimeout.current = null;
                          }

                          setShowPermlinkSuggestions(true);
                        }}
                        onBlur={() => {
                          if (permlinkBlurTimeout.current) {
                            window.clearTimeout(permlinkBlurTimeout.current);
                          }

                          permlinkBlurTimeout.current = window.setTimeout(() => {
                            setShowPermlinkSuggestions(false);
                          }, 150);
                        }}
                        onChange={(e) => {
                          const value = (e.target as HTMLInputElement).value.toLowerCase();
                          setPermlink(value);
                        }}
                        disabled={!isAuthenticated || isPending}
                        className={clsx("w-full", errors.permlink && "is-invalid")}
                        placeholder={i18next.t("proposals.create.permlink-placeholder")}
                      />
                    }
                  >
                    <PopoverContent className="w-72 p-0">
                      <div className="border-b border-[--border-color] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        {i18next.t("proposals.create.permlink-suggestions-title")}
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {permlinkSuggestionsLoading && (
                          <div className="px-3 py-3 text-sm text-gray-500 dark:text-gray-400">
                            {i18next.t("proposals.create.permlink-suggestions-loading")}
                          </div>
                        )}
                        {!permlinkSuggestionsLoading && permlinkSuggestionsError && (
                          <div className="px-3 py-3 text-sm text-red">
                            {i18next.t("proposals.create.permlink-suggestions-error")}
                          </div>
                        )}
                        {!permlinkSuggestionsLoading &&
                          !permlinkSuggestionsError &&
                          permlinkSuggestions.length === 0 && (
                            <div className="px-3 py-3 text-sm text-gray-500 dark:text-gray-400">
                              {i18next.t("proposals.create.permlink-suggestions-empty")}
                            </div>
                          )}
                        {!permlinkSuggestionsLoading &&
                          !permlinkSuggestionsError &&
                          permlinkSuggestions.map((item) => (
                            <button
                              key={item.permlink}
                              type="button"
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => {
                                if (permlinkBlurTimeout.current) {
                                  window.clearTimeout(permlinkBlurTimeout.current);
                                  permlinkBlurTimeout.current = null;
                                }

                                setPermlink(item.permlink);
                                setShowPermlinkSuggestions(false);
                              }}
                              className="flex w-full flex-col gap-1 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-dark-200"
                            >
                              <span className="truncate text-sm text-gray-900 dark:text-gray-100">
                                {item.title || item.permlink}
                              </span>
                              <span className="truncate text-xs text-gray-500 dark:text-gray-400">
                                @{activeUser?.username}/{item.permlink}
                              </span>
                            </button>
                          ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                {errors.permlink && (
                  <p className="text-xs text-red">{errors.permlink}</p>
                )}
                <p className="text-xs text-gray-500">
                  {i18next.t("proposals.create.permlink-help")}
                </p>
              </div>

              <div>
                <label className="font-medium text-sm text-gray-700 dark:text-gray-200">
                  {i18next.t("proposals.create.receiver-label")}
                </label>
                <FormControl
                  type="text"
                  value={receiver}
                  onChange={(e) => setReceiver((e.target as HTMLInputElement).value.toLowerCase())}
                  disabled={!isAuthenticated || isPending}
                  className={clsx(errors.receiver && "is-invalid")}
                  placeholder={i18next.t("proposals.create.receiver-placeholder")}
                />
                {errors.receiver && (
                  <p className="text-xs text-red mt-1">{errors.receiver}</p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  {i18next.t("proposals.create.receiver-help")}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="font-medium text-sm text-gray-700 dark:text-gray-200">
                    {i18next.t("proposals.create.start-label")}
                  </label>
                  <Popover
                    show={showStartPicker}
                    setShow={setShowStartPicker}
                    behavior="click"
                    customClassName="bg-white dark:bg-dark-default border border-[--border-color] rounded-2xl shadow-lg"
                    directContent={
                      <Button
                        type="button"
                        appearance="secondary"
                        outline={true}
                        onClick={() => setShowStartPicker((val) => !val)}
                        disabled={!isAuthenticated || isPending}
                      >
                        {startDateDisplay}
                      </Button>
                    }
                  >
                    <PopoverContent className="p-3">
                      <Datepicker
                        value={startDate}
                        minDate={new Date()}
                        onChange={(date) => {
                          setStartDate(date);
                          setShowStartPicker(false);
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.startDate && (
                    <p className="text-xs text-red">{errors.startDate}</p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <label className="font-medium text-sm text-gray-700 dark:text-gray-200">
                    {i18next.t("proposals.create.end-label")}
                  </label>
                  <Popover
                    show={showEndPicker}
                    setShow={setShowEndPicker}
                    behavior="click"
                    customClassName="bg-white dark:bg-dark-default border border-[--border-color] rounded-2xl shadow-lg"
                    directContent={
                      <Button
                        type="button"
                        appearance="secondary"
                        outline={true}
                        onClick={() => setShowEndPicker((val) => !val)}
                        disabled={!isAuthenticated || isPending}
                      >
                        {endDateDisplay}
                      </Button>
                    }
                  >
                    <PopoverContent className="p-3">
                      <Datepicker
                        value={endDate}
                        minDate={startDate ?? new Date()}
                        onChange={(date) => {
                          setEndDate(date);
                          setShowEndPicker(false);
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.endDate && (
                    <p className="text-xs text-red">{errors.endDate}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="font-medium text-sm text-gray-700 dark:text-gray-200">
                  {i18next.t("proposals.create.daily-pay-label")}
                </label>
                <FormControl
                  type="number"
                  min="0"
                  step="0.001"
                  value={dailyPay}
                  onChange={(e) => setDailyPay((e.target as HTMLInputElement).value)}
                  disabled={!isAuthenticated || isPending}
                  className={clsx("max-w-xs", errors.dailyPay && "is-invalid")}
                  placeholder="10.000"
                />
                {errors.dailyPay && (
                  <p className="text-xs text-red mt-1">{errors.dailyPay}</p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  {i18next.t("proposals.create.daily-pay-help")}
                </p>
              </div>

              <div className="bg-gray-100 dark:bg-dark-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                {summaryItems.map((item) => (
                  <div key={item.label} className="flex flex-col">
                    <span className="font-medium text-gray-700 dark:text-gray-100">
                      {item.label}
                    </span>
                    {item.value && <span>{item.value}</span>}
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <Button type="submit" disabled={!isAuthenticated || isPending}>
                  {i18next.t("g.continue")}
                </Button>
                {!isAuthenticated && (
                  <Button
                    type="button"
                    appearance="secondary"
                    onClick={() => toggleUiProp("login")}
                  >
                    {i18next.t("proposals.create.login-button")}
                  </Button>
                )}
              </div>
            </Form>
          </div>
        </div>
      )}

      {step === 2 && (
        <div
          className={clsx(
            "transaction-form rounded-2xl border border-[--border-color] bg-white dark:bg-dark-default shadow-sm",
            isPending && "in-progress"
          )}
        >
          <div className="transaction-form-header px-6 py-5">
            <div className="step-no">2</div>
            <div className="box-titles">
              <div className="main-title">{i18next.t("trx-common.sign-title")}</div>
              <div className="sub-title">
                {i18next.t("proposals.create.step-sign-sub-title")}
              </div>
            </div>
          </div>
          {isPending && <LinearProgress />}
          <div className="transaction-form-body px-6 py-6 flex flex-col gap-6">
            <div className="bg-gray-100 dark:bg-dark-200 rounded-xl p-4 text-sm space-y-2">
              <div>
                <span className="font-semibold text-gray-700 dark:text-gray-100">
                  {i18next.t("proposals.create.summary-title")}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <div className="text-gray-500 dark:text-gray-400 text-xs uppercase">
                    {i18next.t("proposals.create.subject-label")}
                  </div>
                  <div className="text-sm text-gray-800 dark:text-gray-100">{subject}</div>
                </div>
                <div>
                  <div className="text-gray-500 dark:text-gray-400 text-xs uppercase">
                    {i18next.t("proposals.create.receiver-label")}
                  </div>
                  <div className="text-sm text-gray-800 dark:text-gray-100">@{receiver}</div>
                </div>
                <div>
                  <div className="text-gray-500 dark:text-gray-400 text-xs uppercase">
                    {i18next.t("proposals.create.permlink-label")}
                  </div>
                  <div className="text-sm text-gray-800 dark:text-gray-100">{permlink}</div>
                </div>
                <div>
                  <div className="text-gray-500 dark:text-gray-400 text-xs uppercase">
                    {i18next.t("proposals.create.start-label")}
                  </div>
                  <div className="text-sm text-gray-800 dark:text-gray-100">{startDateDisplay}</div>
                </div>
                <div>
                  <div className="text-gray-500 dark:text-gray-400 text-xs uppercase">
                    {i18next.t("proposals.create.end-label")}
                  </div>
                  <div className="text-sm text-gray-800 dark:text-gray-100">{endDateDisplay}</div>
                </div>
                <div>
                  <div className="text-gray-500 dark:text-gray-400 text-xs uppercase">
                    {i18next.t("proposals.create.daily-pay-label")}
                  </div>
                  <div className="text-sm text-gray-800 dark:text-gray-100">
                    {formatDisplayAmount(Math.max(0, dailyPayNumber))} HBD
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                disabled={isPending}
                isLoading={isPending}
                onClick={handleSign}
              >
                {i18next.t("trx-common.sign-title")}
              </Button>
              <Button appearance="gray" onClick={() => setStep(1)} disabled={isPending}>
                {i18next.t("g.back")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="transaction-form rounded-2xl border border-[--border-color] bg-white dark:bg-dark-default shadow-sm">
          <div className="transaction-form-header px-6 py-5">
            <div className="step-no">3</div>
            <div className="box-titles">
              <div className="main-title">{i18next.t("proposals.create.success-title")}</div>
              <div className="sub-title">
                {i18next.t("proposals.create.success-sub-title")}
              </div>
            </div>
          </div>
          <div className="transaction-form-body px-6 py-10 flex flex-col items-center gap-4 text-center">
            <div className="text-green text-4xl">{checkAllSvg}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {i18next.t("proposals.create.success-description")}
            </div>
            <Button onClick={resetForm}>{i18next.t("proposals.create.new-proposal")}</Button>
          </div>
        </div>
      )}
    </div>
  );
}
