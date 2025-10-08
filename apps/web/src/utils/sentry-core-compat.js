const corePackagePath = require.resolve("@sentry/core/package.json");
const coreIndexPath = corePackagePath.replace(/package\\.json$/, "build/cjs/index.js");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const core = require(coreIndexPath);
// eslint-disable-next-line @typescript-eslint/no-var-requires
const utils = require("@sentry/utils");

module.exports = {
  ...core,
  _optionalChain: utils._optionalChain,
  _nullishCoalesce: utils._nullishCoalesce
};
