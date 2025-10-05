const globalLike = globalThis as Record<string, unknown> & {
  _scrypt_bsv?: unknown;
  __scryptBsvVersion?: unknown;
  __scryptWarningsPatched?: boolean;
};

const knownVersion = globalLike.__scryptBsvVersion;
if (typeof knownVersion === "string" && globalLike._scrypt_bsv === knownVersion) {
  delete globalLike._scrypt_bsv;
}

if (!globalLike.__scryptWarningsPatched) {
  const originalWarn = console.warn.bind(console);
  console.warn = (...args: unknown[]) => {
    const [first] = args;
    if (typeof first === "string") {
      if (first.includes("More than one instance of scrypt bsv found")) {
        return;
      }
      if (first.includes("bigint: Failed to load bindings")) {
        return;
      }
    }
    originalWarn(...(args as Parameters<typeof console.warn>));
  };
  globalLike.__scryptWarningsPatched = true;
}

export function rememberScryptBsvVersion() {
  if (typeof globalLike._scrypt_bsv !== "undefined") {
    globalLike.__scryptBsvVersion = globalLike._scrypt_bsv;
  }
}
