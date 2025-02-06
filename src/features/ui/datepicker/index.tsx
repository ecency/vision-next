import { useMemo, useState } from "react";
import { Button } from "@ui/button";
import { UilArrowLeft, UilArrowRight } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
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
import { clsx } from "clsx";
import { FormControl } from "@ui/input";

interface Props {
  value: Date | undefined;
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

    let temp = new Date(weekStartDate.toISOString());
    while (temp.getDate() !== endWeekDate.getDate() || temp.getMonth() !== endWeekDate.getMonth()) {
      temp = addDays(temp, 1);
      allDates.push(temp);
    }

    return allDates;
  }, [calendarValue]);

  const hours = useMemo(() => new Array(24).fill(1).map((_, i) => i), []);
  const minutes = useMemo(() => new Array(60).fill(1).map((_, i) => i), []);

  return (
    <div className="ecency-datepicker">
      <div className="flex justify-between gap-4">
        <Button
          size="sm"
          className="!h-[36px]"
          appearance="gray"
          onClick={() => setCalendarValue(subMonths(calendarValue, 1))}
          icon={<UilArrowLeft />}
        />
        <div className="capitalize font-semibold">
          {currentMonth} {calendarValue.getFullYear()}
        </div>
        <Button
          size="sm"
          className="!h-[36px]"
          appearance="gray"
          onClick={() => setCalendarValue(addMonths(calendarValue, 1))}
          icon={<UilArrowRight />}
        />
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
          <div
            className={clsx(
              day.getMonth() !== calendarValue.getMonth() && "opacity-50",
              addHours(new Date(), 1).getTime() > day.getTime() && "!opacity-25 cursor-not-allowed",
              "cursor-pointer text-base h-[54px] flex items-center justify-center rounded-xl text-gray-600 dark:text-gray-400  hover:bg-blue-duck-egg hover:text-blue-dark-sky hover:dark:bg-dark-default focus:text-blue-dark-sky-active focus:dark:bg-dark-200",
              props.value?.getDate() === day.getDate() &&
                props.value?.getMonth() === day.getMonth() &&
                "bg-gray-200 !text-blue-dark-sky dark:bg-gray-800"
            )}
            key={`${day.getDate()}-${day.getMonth()}-${day.getFullYear()}`}
            onClick={() =>
              addHours(new Date(), 1).getTime() <= day.getTime() &&
              props.onChange(
                setMinutes(
                  setHours(day, (props.value ?? calendarValue).getHours()),
                  (props.value ?? calendarValue).getMinutes()
                )
              )
            }
          >
            {day.getDate()}
          </div>
        ))}
      </div>

      <div className="flex justify-center gap-4 my-4 border-t border-[--border-color] pt-4">
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
