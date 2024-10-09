const { withSentryConfig } = require("@sentry/nextjs");

const path = require("path");
const withPWA = require("next-pwa")({
  dest: "public"
});
const appPackage = require("./package.json");
const { v4 } = require("uuid");

const config = {
  productionBrowserSourceMaps: true,
  sassOptions: {
    includePaths: [path.join(__dirname, "src/styles")]
  },
  generateBuildId: async () => v4(),
  webpack: (config, options) => {
    config.module.rules.push({
      test: /\.(mp3)$/,
      type: "asset/resource",
      generator: {
        filename: "static/chunks/[path][name].[hash][ext]"
      }
    });

    return config;
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.ecency.com",
        port: ""
      },
      {
        protocol: "https",
        hostname: "ecency.com",
        port: ""
      }
    ]
  },
  // Warn: Rewrites applies in order
  async rewrites() {
    return [
      {
        source: "/chats/:community/channel",
        destination: "/chats/:community/channel"
      },
      {
        source: "/:author(@.+)/feed",
        destination: "/feed/feed/:author"
      },
      {
        source:
          "/:author(@.+)/:section(posts|blog|comments|replies|communities|trail|wallet|engine|points|spk|settings|referrals|permissions|rss|rss.xml)",
        destination: "/profile/:author/:section"
      },
      {
        source: "/:tag/:community(hive-.+)/:sub",
        destination: "/community/:community/:tag/:sub"
      },
      {
        source: "/:tag/:community(hive-.+)",
        destination: "/community/:community/:tag"
      },
      {
        source: "/:category/:author(@.+)/:permlink/:sub",
        destination: "/entry/:category/:author/:permlink/:sub"
      },
      {
        source: "/:author(@.+)/:permlink/edit",
        destination: "/entry/created/:author/:permlink/edit"
      },
      {
        source: "/:category/:author(@.+)/:permlink",
        destination: "/entry/:category/:author/:permlink"
      },
      {
        source: "/:author(@.+)/:permlink",
        destination: "/entry/created/:author/:permlink"
      },
      {
        source: "/:author(@.+)",
        destination: "/profile/:author"
      },
      {
        source: "/:filter(hot|created|trending|controversial|rising|promoted)/:tag/:sub",
        destination: "/feed/:filter/:tag/:sub"
      },
      {
        source: "/:filter(hot|created|trending|controversial|rising|promoted)/:tag",
        destination: "/feed/:filter/:tag"
      },
      {
        source: "/:filter(hot|created|trending|controversial|rising|promoted)",
        destination: "/feed/:filter"
      }
    ];
  }
};

const withSentry = withSentryConfig(config, {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  org: "ecency",
  project: "ecency-next",
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Only print logs for uploading source maps in CI
  silent: false,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  // tunnelRoute: "/monitoring",

  // Hides source maps from generated client bundles
  hideSourceMaps: true,

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: false
});

/** @type {import('next').NextConfig} */
const nextWithPWA = withPWA(withSentry);
module.exports = process.env.NODE_ENV === "production" ? nextWithPWA : withSentry;
