import { format, formatDistanceToNow, formatRelative } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import type { Locale } from 'date-fns';
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

/**
 * Parse a date string from Hive blockchain (UTC) into a Date object
 * Hive dates are in format "2024-01-16T10:00:00" without timezone indicator
 * They should be treated as UTC
 */
function parseHiveDate(date: Date | string | number): Date {
  if (date instanceof Date) return date;
  if (typeof date === 'number') return new Date(date);

  // Hive dates don't have timezone indicator, treat as UTC
  const dateStr = String(date);
  if (!dateStr.endsWith('Z') && !dateStr.includes('+') && !dateStr.includes('-', 10)) {
    return new Date(dateStr + 'Z');
  }
  return new Date(dateStr);
}

function getLocale(): Locale {
  const language = InstanceConfigManager.getConfigValue(
    ({ configuration }) => configuration.general.language,
  );
  return localeMap[language] || enUS;
}

function getTimezone(): string {
  return InstanceConfigManager.getConfigValue(
    ({ configuration }) => configuration.general.timezone || 'UTC',
  );
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
 * Format a date using the configured date format and timezone
 */
export function formatDate(date: Date | string | number): string {
  const utcDate = parseHiveDate(date);
  const zonedDate = toZonedTime(utcDate, getTimezone());
  return format(zonedDate, getDateFormat(), { locale: getLocale() });
}

/**
 * Format a time using the configured time format and timezone
 */
export function formatTime(date: Date | string | number): string {
  const utcDate = parseHiveDate(date);
  const zonedDate = toZonedTime(utcDate, getTimezone());
  return format(zonedDate, getTimeFormat(), { locale: getLocale() });
}

/**
 * Format a date and time using the configured datetime format and timezone
 */
export function formatDateTime(date: Date | string | number): string {
  const utcDate = parseHiveDate(date);
  const zonedDate = toZonedTime(utcDate, getTimezone());
  return format(zonedDate, getDateTimeFormat(), { locale: getLocale() });
}

/**
 * Format a date as relative time (e.g., "2 hours ago")
 * This compares UTC times correctly regardless of browser timezone
 */
export function formatRelativeTime(date: Date | string | number): string {
  const utcDate = parseHiveDate(date);
  // formatDistanceToNow compares UTC timestamps internally, so we just need
  // to ensure the input date is parsed as UTC (which parseHiveDate does)
  return formatDistanceToNow(utcDate, { addSuffix: true, locale: getLocale() });
}

/**
 * Format a date relative to now (e.g., "yesterday at 3:00 PM")
 */
export function formatRelativeDate(date: Date | string | number): string {
  const utcDate = parseHiveDate(date);
  const timezone = getTimezone();
  const zonedDate = toZonedTime(utcDate, timezone);
  const zonedNow = toZonedTime(new Date(), timezone);
  return formatRelative(zonedDate, zonedNow, { locale: getLocale() });
}

/**
 * Format a date for display (month and year only)
 */
export function formatMonthYear(date: Date | string | number): string {
  const utcDate = parseHiveDate(date);
  const zonedDate = toZonedTime(utcDate, getTimezone());
  return format(zonedDate, 'MMMM yyyy', { locale: getLocale() });
}

/**
 * Custom format with locale support and timezone
 */
export function formatCustom(
  date: Date | string | number,
  formatStr: string,
): string {
  const utcDate = parseHiveDate(date);
  const zonedDate = toZonedTime(utcDate, getTimezone());
  return format(zonedDate, convertFormatPattern(formatStr), {
    locale: getLocale(),
  });
}
