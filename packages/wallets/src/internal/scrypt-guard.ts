/**
 * The scrypt bsv package writes the version string to a global symbol and
 * warns when that symbol is already populated.  In environments that reload
 * modules (Next.js dev server, Storybook, etc.) the stale value triggers
 * repeated warnings.  Clearing the cached handle before our modules touch bsv
 * keeps the console quiet without requiring downstream wrappers.
 */
const globalLike = globalThis as Record<string, unknown> & {
  _scrypt_bsv?: unknown;
  __scryptBsvPreviousVersion?: unknown;
};

if (typeof globalLike._scrypt_bsv !== "undefined") {
  if (typeof globalLike._scrypt_bsv === "string") {
    globalLike.__scryptBsvPreviousVersion = globalLike._scrypt_bsv;
  }

  try {
    delete globalLike._scrypt_bsv;
  } catch {
    globalLike._scrypt_bsv = undefined;
  }
}

export function rememberScryptBsvVersion() {
  if (typeof globalLike._scrypt_bsv === "string") {
    globalLike.__scryptBsvPreviousVersion = globalLike._scrypt_bsv;
  }
}
