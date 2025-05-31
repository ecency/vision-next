"use client";

import { UilArrowLeft, UilArrowRight } from "@tooni/iconscout-unicons-react";
import { Button } from "@ui/button";
import { FormControl } from "@ui/input";
import { clsx } from "clsx";
import {
  addDays,
  addHours,
  addMonths,
  endOfMonth,
  endOfWeek,
  setDay,
  setHours,
  setMinutes,
  startOfMonth,
  startOfWeek,
  subMonths
} from "date-fns";
import i18next from "i18next";
import { useMemo, useState } from "react";
import { DatepickerCell } from "./datepicker-cell";

interface Props {
  value: Date | undefined;
  minDate: Date | undefined;
  onChange: (value: Date) => void;
}

export function Datepicker(props: Props) {
  const [calendarValue, setCalendarValue] = useState<Date>(setDay(props.value ?? new Date(), 1));

  const monthFormat = useMemo(() => Intl.DateTimeFormat(i18next.language, { month: "long" }), []);
  const currentMonth = useMemo(
    () => monthFormat.format(calendarValue),
    [monthFormat, calendarValue]
  );

  const weekdaysFormat = useMemo(
    () => Intl.DateTimeFormat(i18next.language, { weekday: "short" }),
    []
  );
  const weekdays = useMemo(
    () =>
      Array.from(new Array(7).keys()).map((day) =>
        weekdaysFormat.format(new Date(Date.UTC(2021, 1, day + 1)))
      ),
    [weekdaysFormat]
  );
  const monthDays = useMemo(() => {
    const monthStartDate = startOfMonth(calendarValue);
    const monthEndDate = endOfMonth(calendarValue);

    const weekStartDate = addDays(startOfWeek(monthStartDate), 1);
    const endWeekDate = addDays(endOfWeek(monthEndDate), 1);

    const allDates = [weekStartDate];
    const now = new Date();

    let temp = new Date(weekStartDate.toISOString());
    while (temp.getDate() !== endWeekDate.getDate() || temp.getMonth() !== endWeekDate.getMonth()) {
      temp = setHours(addDays(temp, 1), now.getHours());
      allDates.push(temp);
    }
    return allDates;
  }, [calendarValue]);

  const hours = useMemo(() => new Array(24).fill(1).map((_, i) => i), []);
  const minutes = useMemo(() => new Array(60).fill(1).map((_, i) => i), []);

  return (
    <div className="ecency-datepicker">
      <div className="flex justify-between items-center gap-4">
        <div className="capitalize md:text-xl lg:text-2xl">
          <b>{currentMonth}</b> {calendarValue.getFullYear()}
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="xs"
            appearance="gray"
            onClick={() => setCalendarValue(subMonths(calendarValue, 1))}
            icon={<UilArrowLeft />}
          />
          <Button size="xs" appearance="gray" onClick={() => setCalendarValue(new Date())}>
            {i18next.t("g.today")}
          </Button>
          <Button
            size="xs"
            appearance="gray"
            onClick={() => setCalendarValue(addMonths(calendarValue, 1))}
            icon={<UilArrowRight />}
          />
        </div>
      </div>
      <div className="grid grid-cols-7 gap-4 text-sm text-center">
        {weekdays.map((weekday) => (
          <div
            className="text-gray-500 dark:text-gray-600 uppercase pt-6 flex items-center justify-center"
            key={weekday}
          >
            {weekday}
          </div>
        ))}
        {monthDays.map((day) => (
          <DatepickerCell
            key={`${day.getDate()}-${day.getMonth()}-${day.getFullYear()}`}
            calendarValue={calendarValue}
            value={props.value}
            day={day}
            onPick={props.onChange}
          />
        ))}
      </div>

      <div className="flex justify-center gap-4 mt-4 border-t border-[--border-color] pt-4 -mx-2 md:-mx-4">
        <FormControl
          type="select"
          className="max-w-[100px]"
          value={(props.value ?? calendarValue).getHours()}
          onChange={(e) =>
            props.onChange(setHours(props.value ?? calendarValue, (e.target as any).value))
          }
        >
          {hours.map((hour) => (
            <option key={hour} value={hour}>
              {hour}
            </option>
          ))}
        </FormControl>
        <FormControl
          type="select"
          className="max-w-[100px]"
          value={(props.value ?? calendarValue).getMinutes()}
          onChange={(e) =>
            props.onChange(setMinutes(props.value ?? calendarValue, (e.target as any).value))
          }
        >
          {minutes.map((min) => (
            <option key={min} value={min}>
              {min}
            </option>
          ))}
        </FormControl>
      </div>
    </div>
  );
}
