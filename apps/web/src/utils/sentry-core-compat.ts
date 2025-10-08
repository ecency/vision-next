const corePackagePath = require.resolve("@sentry/core/package.json");
const coreIndexPath = corePackagePath.replace(/package\\.json$/, "build/cjs/index.js");
const core = require(coreIndexPath);
const utils = require("@sentry/utils");

module.exports = {
  ...core,
  _optionalChain: utils._optionalChain,
  _nullishCoalesce: utils._nullishCoalesce
};
