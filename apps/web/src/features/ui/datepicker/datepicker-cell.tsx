import clsx from "clsx";
import dayjs from "@/utils/dayjs";
import { useCallback, useMemo } from "react";

interface Props {
  day: Date;
  value?: Date;
  calendarValue: Date;
  onPick: (date: Date) => void;
}

export function DatepickerCell({ day, value, calendarValue, onPick }: Props) {
  const isAnotherMonth = useMemo(
    () => day.getMonth() !== calendarValue.getMonth(),
    [day, calendarValue]
  );
  const isPast = useMemo(() => dayjs().isAfter(dayjs(day).add(1, "hour")), [day]);
  const hasSelected = useMemo(
    () => value?.getDate() === day.getDate() && value?.getMonth() === day.getMonth(),
    [day, value]
  );

  const click = useCallback(() => {
    if (dayjs().isBefore(dayjs(day).add(1, "hour"))) {
      onPick(
        dayjs(day)
          .hour((value ?? calendarValue).getHours())
          .minute((value ?? calendarValue).getMinutes())
          .toDate()
      );
    }
  }, [value, onPick, calendarValue, day]);

  return (
    <div
      className={clsx(
        isAnotherMonth && "opacity-50",
        isPast && "!opacity-25 !cursor-not-allowed",
        "cursor-pointer text-base h-[54px] flex items-center justify-center rounded-xl text-gray-800 dark:text-gray-200  hover:bg-blue-duck-egg hover:text-blue-dark-sky hover:dark:bg-dark-default focus:text-blue-dark-sky-active focus:dark:bg-dark-200",
        hasSelected && "bg-gray-200 !text-blue-dark-sky dark:bg-gray-800"
      )}
      onClick={click}
    >
      {day.getDate()}
    </div>
  );
}
