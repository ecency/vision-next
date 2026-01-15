import { format, formatDistanceToNow, formatRelative } from 'date-fns';
import {
  de,
  enUS,
  es,
  fr,
  id,
  it,
  ja,
  ko,
  pl,
  pt,
  ru,
  tr,
  uk,
  vi,
  zhCN,
} from 'date-fns/locale';
import { InstanceConfigManager } from './configuration-loader';

// Map language codes to date-fns locales
const localeMap: Record<string, Locale> = {
  en: enUS,
  es: es,
  de: de,
  fr: fr,
  pt: pt,
  ru: ru,
  ko: ko,
  ja: ja,
  zh: zhCN,
  it: it,
  tr: tr,
  pl: pl,
  uk: uk,
  vi: vi,
  id: id,
};

// Convert config format patterns to date-fns format patterns
// Config uses common patterns like YYYY-MM-DD, date-fns uses yyyy-MM-dd
function convertFormatPattern(pattern: string): string {
  return pattern
    .replace(/YYYY/g, 'yyyy')
    .replace(/YY/g, 'yy')
    .replace(/DD/g, 'dd')
    .replace(/D/g, 'd');
}

function getLocale(): Locale {
  const language = InstanceConfigManager.getConfigValue(
    ({ configuration }) => configuration.general.language,
  );
  return localeMap[language] || enUS;
}

function getDateFormat(): string {
  const configFormat = InstanceConfigManager.getConfigValue(
    ({ configuration }) => configuration.general.dateFormat,
  );
  return convertFormatPattern(configFormat || 'yyyy-MM-dd');
}

function getTimeFormat(): string {
  const configFormat = InstanceConfigManager.getConfigValue(
    ({ configuration }) => configuration.general.timeFormat,
  );
  return convertFormatPattern(configFormat || 'HH:mm:ss');
}

function getDateTimeFormat(): string {
  const configFormat = InstanceConfigManager.getConfigValue(
    ({ configuration }) => configuration.general.dateTimeFormat,
  );
  return convertFormatPattern(configFormat || 'yyyy-MM-dd HH:mm:ss');
}

/**
 * Format a date using the configured date format
 */
export function formatDate(date: Date | string | number): string {
  const dateObj =
    typeof date === 'string' || typeof date === 'number'
      ? new Date(date)
      : date;
  return format(dateObj, getDateFormat(), { locale: getLocale() });
}

/**
 * Format a time using the configured time format
 */
export function formatTime(date: Date | string | number): string {
  const dateObj =
    typeof date === 'string' || typeof date === 'number'
      ? new Date(date)
      : date;
  return format(dateObj, getTimeFormat(), { locale: getLocale() });
}

/**
 * Format a date and time using the configured datetime format
 */
export function formatDateTime(date: Date | string | number): string {
  const dateObj =
    typeof date === 'string' || typeof date === 'number'
      ? new Date(date)
      : date;
  return format(dateObj, getDateTimeFormat(), { locale: getLocale() });
}

/**
 * Format a date as relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | string | number): string {
  const dateObj =
    typeof date === 'string' || typeof date === 'number'
      ? new Date(date)
      : date;
  return formatDistanceToNow(dateObj, { addSuffix: true, locale: getLocale() });
}

/**
 * Format a date relative to now (e.g., "yesterday at 3:00 PM")
 */
export function formatRelativeDate(date: Date | string | number): string {
  const dateObj =
    typeof date === 'string' || typeof date === 'number'
      ? new Date(date)
      : date;
  return formatRelative(dateObj, new Date(), { locale: getLocale() });
}

/**
 * Format a date for display (month and year only)
 */
export function formatMonthYear(date: Date | string | number): string {
  const dateObj =
    typeof date === 'string' || typeof date === 'number'
      ? new Date(date)
      : date;
  return format(dateObj, 'MMMM yyyy', { locale: getLocale() });
}

/**
 * Custom format with locale support
 */
export function formatCustom(
  date: Date | string | number,
  formatStr: string,
): string {
  const dateObj =
    typeof date === 'string' || typeof date === 'number'
      ? new Date(date)
      : date;
  return format(dateObj, convertFormatPattern(formatStr), {
    locale: getLocale(),
  });
}
