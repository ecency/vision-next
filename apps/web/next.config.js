const { withSentryConfig } = require("@sentry/nextjs");

const path = require("path");
const withPWA = require("next-pwa")({
  dest: "public",
  // Raise the max size to precache large chunks:
  maximumFileSizeToCacheInBytes: 8 * 1024 * 1024, // 8MB
  // Advanced caching strategies for better performance
  runtimeCaching: [
    {
      // Cache API responses with network-first strategy
      urlPattern: /^https:\/\/ecency\.com\/api\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'ecency-api',
        networkTimeoutSeconds: 3,
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 5 * 60 // 5 minutes
        },
        cacheableResponse: {
          statuses: [0, 200]
        }
      }
    },
    {
      // Cache local images and static assets
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'local-images',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
        }
      }
    },
    {
      // Cache fonts
      urlPattern: /\.(?:woff|woff2|ttf|otf|eot)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'fonts',
        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 365 * 24 * 60 * 60 // 1 year
        }
      }
    }
  ]
});
const appPackage = require("./package.json");
const { v4 } = require("uuid");

const config = {
  productionBrowserSourceMaps: true,
  htmlLimitedBots:
    /Mediapartners-Google|Chrome-Lighthouse|Slurp|DuckDuckBot|baiduspider|yandex|sogou|bitlybot|tumblr|vkShare|quora link preview|redditbot|ia_archiver|Bingbot|BingPreview|applebot|facebookexternalhit|facebookcatalog|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|SkypeUriPreview|Yeti/,
  sassOptions: {
    implementation: require.resolve("sass-embedded"),
    includePaths: [path.join(__dirname), path.join(__dirname, "src/styles")],
    silenceDeprecations: ["legacy-js-api", "import", "global-builtin", "color-functions"]
  },
  generateBuildId: async () => v4(),
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  transpilePackages: ["@ecency/sdk", "@ecency/wallets", "@ecency/renderer"],
  experimental: {
    externalDir: true
  },

  webpack: (config, { isServer }) => {
    config.infrastructureLogging = { level: "error" };
    config.stats = "errors-only";
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
    config.resolve.alias = {
        ...(config.resolve.alias || {}),
        sass: "sass-embedded"
    };

    // Exclude WebSocket native modules from bundling (server-side only)
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'bufferutil': 'commonjs bufferutil',
        'utf-8-validate': 'commonjs utf-8-validate',
      });
    }

    const reactQueryPackagePath = path.dirname(
      require.resolve("@tanstack/react-query/package.json")
    );
    const queryCorePackagePath = path.dirname(
      require.resolve("@tanstack/query-core/package.json")
    );

    config.resolve.alias["@tanstack/react-query"] = reactQueryPackagePath;
    config.resolve.alias["@tanstack/query-core"] = queryCorePackagePath;

    if (isServer) {
      config.externals.push("formidable", "hexoid");
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
  async redirects() {
    return [
      // Legacy pages
      {
        source: "/:author(@[^/]+)/points",
        destination: "/:author/wallet/points",
        permanent: false
      },
      {
        source: "/:author(@[^/]+)/spk",
        destination: "/:author/wallet/spk",
        permanent: false
      },
      {
        source: "/:author(@[^/]+)/engine",
        destination: "/:author/wallet",
        permanent: false
      }
    ];
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
        source: "/:author(@.+)/wallet/points",
        destination: "/profile/:author/wallet/points"
      },
      {
        source: "/:author(@.+)/wallet/:token",
        destination: "/profile/:author/wallet/:token"
      },
      {
        source:
          "/:author(@.+)/:section(posts|blog|comments|replies|communities|trail|wallet|settings|insights|referrals|permissions|rss|rss.xml)",
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
