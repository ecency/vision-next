import { ButtonSize } from "@/features/ui";
import { classNameObject } from "@ui/util";
import { BUTTON_SIZES } from "@ui/button/styles";

interface Props {
  size?: ButtonSize;
}

export function ButtonLoading({ size = "md" }: Props) {
  return (
    <div
      className={classNameObject({
        "animate-pulse rounded-full w-full bg-blue-dark-sky-040 dark:bg-blue-dark-grey": true,
        [BUTTON_SIZES[size]]: true
      })}
    />
  );
}
