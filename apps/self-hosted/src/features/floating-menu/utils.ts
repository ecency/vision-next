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

function isForbiddenKey(key: string): boolean {
  return key === '__proto__' || key === 'constructor' || key === 'prototype';
}

/**
 * Update a nested object path with a new value
 */
export function updateNestedPath(
  obj: Record<string, ConfigValue>,
  path: string,
  value: ConfigValue,
): Record<string, ConfigValue> {
  const keys = path.split('.');
  // Upfront whole-path rejection: an adversarial path like
  // `network.__proto__.polluted` must NOT create the intermediate
  // `network = {}` node before the guard fires later in the loop —
  // doing so silently overwrites legitimate config under "rejected"
  // input. So bail out before we touch the clone at all.
  if (keys.some(isForbiddenKey)) {
    return deepClone(obj);
  }

  const newObj = deepClone(obj);
  let current: Record<string, ConfigValue> = newObj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    // Inline guard at each sink line so CodeQL's data-flow analysis sees
    // a sanitiser on the exact assignment (the upfront check above is
    // for correctness; this is what closes the prototype-pollution alert).
    if (isForbiddenKey(key)) {
      return newObj;
    }
    if (
      !current[key] ||
      typeof current[key] !== 'object' ||
      Array.isArray(current[key])
    ) {
      current[key] = {};
    }
    current = current[key] as Record<string, ConfigValue>;
  }

  const finalKey = keys[keys.length - 1]!;
  if (isForbiddenKey(finalKey)) {
    return newObj;
  }
  current[finalKey] = value;
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
