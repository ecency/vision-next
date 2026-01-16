/**
 * The scrypt bsv package writes the version string to a global symbol and
 * warns when that symbol is already populated.  In environments that reload
 * modules (Next.js dev server, Storybook, etc.) the stale value triggers
 * repeated warnings.  Clearing the cached handle before our modules touch bsv
 * keeps the console quiet without requiring downstream wrappers.
 *
 * Similarly, bitcore-lib and bitcore-lib-inquisition check for duplicate instances
 * using global variables and throw errors when detected. We clear these globals
 * to prevent false positives in module reloading scenarios.
 */
const globalLike = globalThis as Record<string, unknown> & {
  _scrypt_bsv?: unknown;
  __scryptBsvPreviousVersion?: unknown;
  _bitcore?: unknown;
  __bitcorePreviousVersion?: unknown;
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

// Clear bitcore-lib global to prevent "more than one instance" errors
if (typeof globalLike._bitcore !== "undefined") {
  if (typeof globalLike._bitcore === "object") {
    globalLike.__bitcorePreviousVersion = globalLike._bitcore;
  }

  try {
    delete globalLike._bitcore;
  } catch {
    globalLike._bitcore = undefined;
  }
}

export function rememberScryptBsvVersion() {
  if (typeof globalLike._scrypt_bsv === "string") {
    globalLike.__scryptBsvPreviousVersion = globalLike._scrypt_bsv;
  }

  // Also remember bitcore version if it exists
  if (typeof globalLike._bitcore === "object") {
    globalLike.__bitcorePreviousVersion = globalLike._bitcore;
  }
}
