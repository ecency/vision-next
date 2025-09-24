const { withSentryConfig } = require("@sentry/nextjs");

const path = require("path");
const withPWA = require("next-pwa")({
  dest: "public",
  // Raise the max size to precache large chunks:
  maximumFileSizeToCacheInBytes: 8 * 1024 * 1024, // 8MB
  cacheOnFrontEndNav: true,
  reloadOnOnline: true,
  swcMinify: true,
  workboxOptions: {
    disableDevLogs: true,
    skipWaiting: false, // Don't skip waiting to avoid sudden updates
    clientsClaim: false, // Don't claim clients immediately
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/ecency\.com\/_next\/static\/.*/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'next-static-resources',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 1 week
          },
          cacheKeyWillBeUsed: async ({ request, mode }) => {
            // Add version to cache key for better invalidation
            const url = new URL(request.url);
            url.searchParams.set('v', appPackage.version);
            return url.toString();
          },
        },
      },
      {
        urlPattern: /^https:\/\/ecency\.com\/_next\/static\/chunks\/.*/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'next-js-chunks',
          networkTimeoutSeconds: 10,
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 24 * 60 * 60, // 1 day
          },
          plugins: [
            {
              cacheKeyWillBeUsed: async ({ request }) => {
                // Add version to cache key for chunks
                const url = new URL(request.url);
                url.searchParams.set('v', appPackage.version);
                return url.toString();
              },
              requestWillFetch: async ({ request }) => {
                // Add cache busting for failed requests
                const url = new URL(request.url);
                if (!url.searchParams.has('retry')) {
                  url.searchParams.set('t', Date.now().toString());
                }
                return new Request(url.toString(), request);
              },
            },
          ],
        },
      },
    ],
  },
});
const appPackage = require("./package.json");
const { v4 } = require("uuid");

const config = {
  productionBrowserSourceMaps: true,
  htmlLimitedBots: /Mediapartners-Google|Chrome-Lighthouse|Slurp|DuckDuckBot|baiduspider|yandex|sogou|bitlybot|tumblr|vkShare|quora link preview|redditbot|ia_archiver|Bingbot|BingPreview|applebot|facebookexternalhit|facebookcatalog|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|SkypeUriPreview|Yeti/,
  sassOptions: {
    includePaths: [path.join(__dirname, "src/styles")]
  },
  generateBuildId: async () => {
    // Use a more stable build ID strategy to reduce cache invalidation
    // This uses the package.json version + date-based suffix for better cache control
    const packageVersion = appPackage.version;
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD format
    return `${packageVersion}-${today}`;
  },
  webpack: (config, { isServer }) => {
    config.module.rules.push({
      test: /\.(mp3)$/,
      type: "asset/resource",
      generator: {
        filename: "static/chunks/[path][name].[hash][ext]"
      }
    });
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false
    };

    if (isServer) {
      config.externals.push("formidable", "hexoid");
    }

    // Add chunk loading error handling for better resilience during deployments
    if (!isServer) {
      config.output.globalObject = 'self';
      
      // Enhance chunk loading with retry mechanism
      const originalJsonpScriptSrc = config.output.chunkLoadingGlobal || '__webpack_require__';
      config.output.crossOriginLoading = 'anonymous';
      
      // Add custom chunk loading error handler
      config.plugins = config.plugins || [];
      config.plugins.push({
        apply: (compiler) => {
          compiler.hooks.compilation.tap('ChunkLoadErrorHandling', (compilation) => {
            compilation.hooks.additionalChunkAssets.tap('ChunkLoadErrorHandling', () => {
              // This will be handled by our client-side error boundary
            });
          });
        }
      });
    }

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
        source: "/pl/js/script.js",
        destination: "https://pl.ecency.com/js/script.js"
      },
      {
        source: "/pl/api/event",
        destination: "https://pl.ecency.com/api/event"
      },
      {
        source: "/communities",
        destination: "/discover/communities"
      },
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
        source: "/:tag((?!hive-)[^@][^/]*)/:community(hive-\\d{5,6})/:sub",
        destination: "/community/:community/:tag/:sub"
      },
      {
        source: "/:tag((?!hive-)[^@][^/]*)/:community(hive-\\d{5,6})",
        destination: "/community/:community/:tag"
      },

      // POSTS
      // Handle waves comment-like post in a wave page
      {
        source: "/:category/:author(@.+)/:permlink/edit",
        destination: "/publish/entry/:author/:permlink"
      },
      {
        source: "/:category/:author(@.+)/:permlink/:sub",
        destination: "/entry/:category/:author/:permlink/:sub"
      },
      {
        source: "/:author(@.+)/:permlink/edit",
        destination: "/publish/entry/:author/:permlink"
      },
      {
        source: "/:category/:author(@.+)/:permlink",
        destination: "/entry/:category/:author/:permlink"
      },

      // PROFILE
      {
        source: "/:author(@.+)/:permlink",
        destination: "/entry/created/:author/:permlink"
      },
      {
        source: "/:author(@.+)",
        destination: "/profile/:author"
      },

      // FEEDS
      {
        source: "/tags/:tag",
        destination: "/feed/created/:tag"
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
const prod = withPWA(withSentry);
module.exports = process.env.NODE_ENV === "production" ? prod : withSentry;
