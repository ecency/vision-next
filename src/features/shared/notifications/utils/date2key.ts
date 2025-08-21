import dayjs from "@/utils/dayjs";
import i18next from "i18next";

export const date2key = (s: string): string => {
  if (s === "Yesterday") {
    return dayjs().subtract(1, "day").fromNow();
  }

  if (s.indexOf("hours") > -1) {
    const h = parseInt(s, 10);
    return dayjs().subtract(h, "hour").fromNow();
  }

  if (s.split("-").length === 3) {
    return dayjs.utc(s).fromNow();
  }

  const gt = i18next.t(`notifications.group-title-${s.toLowerCase()}`);
  if (gt) {
    return gt;
  }

  return s;
};
