const corePackagePath = require.resolve("@sentry/core/package.json");
const coreIndexPath = corePackagePath.replace(/package\\.json$/, "build/cjs/index.js");
const core = require(coreIndexPath);

function _optionalChain(ops: unknown[]) {
  let lastAccessLHS: unknown = undefined;
  let value: any = ops[0];
  let i = 1;

  while (i < ops.length) {
    const op = ops[i] as string;
    const fn = ops[i + 1] as (value: any) => any;

    i += 2;

    if ((op === "optionalAccess" || op === "optionalCall") && (value === null || value === undefined)) {
      return undefined;
    }

    if (op === "access" || op === "optionalAccess") {
      lastAccessLHS = value;
      value = fn(value);
    } else if (op === "call" || op === "optionalCall") {
      value = fn((...args: unknown[]) => (value as any).call(lastAccessLHS, ...args));
      lastAccessLHS = undefined;
    }
  }

  return value;
}

function _nullishCoalesce(lhs: unknown, rhsFn: () => unknown) {
  return lhs ?? rhsFn();
}

module.exports = {
  ...core,
  _optionalChain,
  _nullishCoalesce
};
