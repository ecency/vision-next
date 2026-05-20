import type { ConfigValue } from './types';

/**
 * Deep clone an object using structuredClone if available, otherwise JSON parse/stringify
 */
export function deepClone<T>(obj: T): T {
  if (typeof structuredClone !== 'undefined') {
    return structuredClone(obj);
  }
  return JSON.parse(JSON.stringify(obj));
}

// Reject keys that would mutate the prototype chain. Without this guard,
// a path like "__proto__.polluted" would assign onto Object.prototype.
const FORBIDDEN_KEYS = new Set(["__proto__", "constructor", "prototype"]);

/**
 * Update a nested object path with a new value
 */
export function updateNestedPath(
  obj: Record<string, ConfigValue>,
  path: string,
  value: ConfigValue,
): Record<string, ConfigValue> {
  const newObj = deepClone(obj);
  const keys = path.split('.');
  if (keys.some((k) => FORBIDDEN_KEYS.has(k))) {
    return newObj;
  }
  let current: Record<string, ConfigValue> = newObj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (
      !current[key] ||
      typeof current[key] !== 'object' ||
      Array.isArray(current[key])
    ) {
      current[key] = {};
    }
    current = current[key] as Record<string, ConfigValue>;
  }

  current[keys[keys.length - 1]!] = value;
  return newObj;
}

/**
 * Download JSON as a file
 */
export function downloadJson(data: unknown, filename = 'config.json'): void {
  const configJson = JSON.stringify(data, null, 2);
  const blob = new Blob([configJson], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
