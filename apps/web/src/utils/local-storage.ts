export const PREFIX = "ecency";

export function get(k: string, def: any = null): any {
  if (typeof window === "undefined") {
    return null;
  }

  const key = `${PREFIX}_${k}`;

  try {
    const val = localStorage.getItem(key);
    if (val === null) {
      return def;
    }

    try {
      return JSON.parse(val);
    } catch (e) {
      return val;
    }
  } catch (e) {
    return def;
  }
}

export function set(k: string, v: any): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const key = `${PREFIX}_${k}`;
    localStorage.setItem(key, JSON.stringify(v));
  } catch (e) {}
}

export function remove(k: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const key = `${PREFIX}_${k}`;
    localStorage.removeItem(key);
  } catch (e) {}
}

export function getByPrefix(prefix: string): any[] {
  if (typeof window === "undefined") {
    return [];
  }

  const prefKey = `${PREFIX}_${prefix}`;

  try {
    return Object.keys(localStorage)
      .filter((key) => key.indexOf(prefKey) === 0)
      .map((key) => {
        const raw = localStorage.getItem(key);
        if (raw === null) {
          return null;
        }

        try {
          return JSON.parse(raw);
        } catch (e) {
          return raw;
        }
      })
      .filter((item) => item !== null);
  } catch (e) {
    return [];
  }
}
