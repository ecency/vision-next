import clsx from "clsx";
import { addHours, setHours, setMinutes } from "date-fns";
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
  const isPast = useMemo(() => new Date().getTime() >= addHours(day, 1).getTime(), [day]);
  const hasSelected = useMemo(
    () => value?.getDate() === day.getDate() && value?.getMonth() === day.getMonth(),
    [day, value]
  );

  const click = useCallback(() => {
    if (new Date().getTime() <= addHours(day, 1).getTime()) {
      onPick(
        setMinutes(
          setHours(day, (value ?? calendarValue).getHours()),
          (value ?? calendarValue).getMinutes()
        )
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
