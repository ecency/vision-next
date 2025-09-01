import "@/polyfills";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import relativeTime from "dayjs/plugin/relativeTime";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import calendar from "dayjs/plugin/calendar";
import localizedFormat from "dayjs/plugin/localizedFormat";
import minMax from "dayjs/plugin/minMax";
import "dayjs/locale/bg";
import "dayjs/locale/es";
import "dayjs/locale/fi";
import "dayjs/locale/hi";
import "dayjs/locale/id";
import "dayjs/locale/it";
import "dayjs/locale/pt";
import "dayjs/locale/ru";
import "dayjs/locale/sr";
import "dayjs/locale/uk";
import "dayjs/locale/uz";
import "dayjs/locale/zh-cn";

// Extend dayjs with commonly used plugins
// These are needed for replacing moment.js features across the codebase
// utc & timezone: handling timezone conversions
// relativeTime: fromNow() style formatting
// isSameOrBefore / isSameOrAfter: comparison helpers
// calendar: calendar time formatting
// localizedFormat: format tokens like LLLL
// minMax: max() helper

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.extend(calendar);
dayjs.extend(localizedFormat);
dayjs.extend(minMax);

export default dayjs;
export type { Dayjs } from "dayjs";
