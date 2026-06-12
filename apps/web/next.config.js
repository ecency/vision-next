const { withSentryConfig } = require("@sentry/nextjs");
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true"
});

const path = require("path");
const withPWA = require("next-pwa")({
  dest: "public",
  // Activate a new SW as soon as it finishes installing, and take control of
  // open clients immediately. Paired with <ServiceWorkerRecovery>, which reloads
  // once on `controllerchange` so an open tab doesn't keep running an old webpack
  // runtime against freshly-cached chunks.
  skipWaiting: true,
  clientsClaim: true,
  // Never precache source maps. We upload them to Sentry and then delete them
  // from the build output (deleteSourcemapsAfterUpload), so the .map URLs 404 in
  // production. Workbox's precacheAndRoute fetches every precache entry during
  // SW install and rejects the whole install on any non-OK response — so a SW
  // that precached the (now-missing) .map files could never install/update,
  // stranding users on a stale cache that served mismatched chunks ("Element
  // type is invalid: undefined" → persistent 500).
  buildExcludes: [/\.map$/],
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
          maxEntries: 30,
          maxAgeSeconds: 2 * 60 // 2 minutes
        },
        cacheableResponse: {
          statuses: [0, 200]
        }
      }
    },
    {
      // Cache CDN-proxied images (user avatars, post images).
      // Covers i/img/images.ecency.com — all the same imagehoster backend.
      urlPattern: /^https:\/\/(?:i|img|images)\.ecency\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'ecency-images-cdn',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 7 * 24 * 60 * 60 // 7 days
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
const { execSync } = require("child_process");

const config = {
  // Required for @sentry/nextjs v8 source-map upload — the plugin only
  // uploads .map files that webpack actually emits. Source maps are
  // deleted from the build output after upload (see sourcemaps option
  // in withSentryConfig below) so they aren't shipped publicly.
  productionBrowserSourceMaps: true,
  // Inline SENTRY_RELEASE into the client bundle at build time so
  // sentry.client.config.ts can read it via process.env.SENTRY_RELEASE
  // (Next.js only inlines envs declared here or prefixed NEXT_PUBLIC_).
  // CI sets this to the deploying commit SHA; in local dev the var is
  // unset, so we conditionally spread to avoid `SENTRY_RELEASE: undefined`
  // (which trips Next's env schema). When absent, Sentry.init falls back
  // to package.json version via `process.env.SENTRY_RELEASE ?? appPackage.version`.
  env: {
    ...(process.env.SENTRY_RELEASE && { SENTRY_RELEASE: process.env.SENTRY_RELEASE }),
    // Same treatment for SENTRY_ENVIRONMENT so the client bundle can tag
    // staging (alpha) vs production. Conditionally spread for the same reason.
    ...(process.env.SENTRY_ENVIRONMENT && { SENTRY_ENVIRONMENT: process.env.SENTRY_ENVIRONMENT })
  },
  htmlLimitedBots:
    /Mediapartners-Google|Chrome-Lighthouse|Slurp|DuckDuckBot|baiduspider|yandex|sogou|bitlybot|tumblr|vkShare|quora link preview|redditbot|ia_archiver|Bingbot|BingPreview|applebot|facebookexternalhit|facebookcatalog|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|SkypeUriPreview|Yeti/,
  sassOptions: {
    implementation: require.resolve("sass-embedded"),
    includePaths: [path.join(__dirname), path.join(__dirname, "src/styles")],
    silenceDeprecations: ["legacy-js-api", "import", "global-builtin", "color-functions"]
  },
  generateBuildId: async () => {
    try {
      return execSync("git rev-parse --short HEAD", {
        encoding: "utf8",
        timeout: 5000
      }).trim();
    } catch {
      return Date.now().toString();
    }
  },
  // Deployment skew protection. Tags asset/RSC requests with the per-deploy
  // commit SHA so a client running an older build is detected on navigation and
  // cleanly hard-reloads onto the current build, instead of loading a mismatched
  // chunk (the post-deploy "undefined (reading 'call')" / "element type is
  // invalid" 500s). Reuses the SHA already injected as SENTRY_RELEASE in CI;
  // unset in local dev, where skew protection is inactive (and unnecessary).
  deploymentId: process.env.SENTRY_RELEASE
    ? process.env.SENTRY_RELEASE.replace(/^ecency-next@/, "")
    : undefined,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  transpilePackages: ["@ecency/sdk", "@ecency/wallets", "@ecency/render-helper"],
  experimental: {
    externalDir: true,
    optimizePackageImports: [
      "@tiptap/core",
      "@tiptap/react",
      "@tiptap/starter-kit",
      "@tiptap/pm",
      "highcharts",
      "emoji-mart",
      "@emoji-mart/data",
      "@emoji-mart/react",
      "react-virtualized",
      "date-fns",
      "remeda",
      "@floating-ui/react-dom",
      "@react-spring/web",
      "framer-motion",
      "@sentry/nextjs",
      "@sentry/browser",
    ]
  },

  webpack: (config, { isServer, webpack }) => {
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

    // Replace Next.js built-in polyfills with an empty module on the client.
    // polyfill-module.js ships ~1.5KB of polyfills (Array.prototype.at/flat/flatMap,
    // Object.fromEntries, Object.hasOwn, String.prototype.trimStart/trimEnd,
    // URL.canParse, etc.). The highest minimums among these are:
    //   - Object.hasOwn / Array.prototype.at: Chrome 93+, Firefox 92+, Safari 15.4+, Edge 93+
    //   - URL.canParse: Chrome 120+, Firefox 115+, Safari 17+, Edge 120+
    // All are safe to drop — caniuse shows >96% global coverage and our analytics
    // confirm no meaningful traffic from browsers below these thresholds.
    // PageSpeed flags these as "Legacy JavaScript".
    if (!isServer) {
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /[\\/]next[\\/]dist[\\/]build[\\/]polyfills[\\/]polyfill-module\.js$/,
          path.resolve(__dirname, "src/empty-polyfill.js")
        )
      );
    }
    config.resolve.alias = {
        ...(config.resolve.alias || {}),
        sass: "sass-embedded",
        // Replace full iconscout barrel (1,189 icons, 737 KB) with local file (153 icons, ~50 KB)
        "@tooni/iconscout-unicons-react": path.resolve(__dirname, "src/features/ui/unicons.tsx")
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
        hostname: "i.ecency.com",
        port: ""
      },
      {
        protocol: "https",
        hostname: "img.ecency.com",
        port: ""
      },
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
  async headers() {
    // CSP violation reports are delivered to Sentry's Security endpoint, built
    // from the (public) project DSN already configured in sentry.*.config.ts.
    // report-to is the modern Reporting API channel; report-uri is the broadly-
    // supported fallback. Applied to both the enforcing and report-only policies.
    // NOTE: report-only with a broad script-src can be noisy (browser-extension
    // injected scripts trigger violations) — tune via Sentry inbound filters /
    // rate limits if volume is high.
    const sentryCspReportUri =
      "https://o4507985141956608.ingest.de.sentry.io/api/4507985146609744/security/?sentry_key=8a5c1659d1c2ba3385be28dc7235ce56";
    return [
      {
        // Clickjacking protection on every route: our pages may be framed only
        // by ourselves. Nothing needs cross-origin framing today — the oEmbed
        // provider returns JSON, not a framable document; HiveSigner uses popup
        // windows, not iframes. A future type:"rich" /embed route would add a
        // scoped frame-ancestors exception here.
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Named reporting endpoint (Reporting API) referenced by `report-to`.
          { key: "Reporting-Endpoints", value: `csp-endpoint="${sentryCspReportUri}"` },
          // Conservative Permissions-Policy: deny only powerful features the
          // app never requests. We deliberately DO NOT restrict accelerometer,
          // gyroscope, fullscreen, picture-in-picture, encrypted-media or
          // web-share — the whitelisted video iframe embeds (3Speak/YouTube)
          // request those via their `allow`/`allowfullscreen` attributes, and a
          // top-level `()` here would override the per-iframe grant.
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), browsing-topics=(), interest-cohort=()"
          },
          // ENFORCING CSP — only directives that cannot break JS/CSS execution
          // or block the app's existing cross-origin fetches/frames/images. We
          // intentionally do NOT set default-src/script-src/style-src/
          // connect-src/img-src/frame-src here: a strict script-src would break
          // Next.js inline hydration + next/font inline <style> + the ld+json
          // <script>, and a default-src would block legit RPC/Sentry/embed/
          // image hosts. Those live in the Report-Only header below until
          // monitored and promoted. frame-ancestors 'self' preserves the
          // existing clickjacking protection.
          {
            key: "Content-Security-Policy",
            value: [
              "object-src 'none'",
              "base-uri 'self'",
              "frame-ancestors 'self'",
              "form-action 'self'",
              "report-to csp-endpoint",
              `report-uri ${sentryCspReportUri}`
            ].join("; ")
          },
          // REPORT-ONLY CSP — the full inventoried policy. Reports violations
          // without blocking, so it can be promoted to enforcing after
          // monitoring. script-src/style-src keep 'unsafe-inline' because
          // Next.js bootstrap, next/font and JSON-LD inject inline scripts/
          // styles with no nonce plumbing in middleware (a nonce CSP would
          // require reworking middleware + next-pwa precache; out of scope).
          {
            key: "Content-Security-Policy-Report-Only",
            value: [
              "default-src 'self'",
              // Plausible is served first-party via the /pl/ rewrite, so no
              // external analytics host is needed. Turnstile + react-tweet are
              // the only external script origins.
              "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://platform.twitter.com",
              "script-src-elem 'self' 'unsafe-inline' https://challenges.cloudflare.com https://platform.twitter.com",
              "style-src 'self' 'unsafe-inline'",
              "font-src 'self' data:",
              [
                "connect-src 'self'",
                "https://ecency.com https://hapi.ecency.com https://i.ecency.com https://img.ecency.com https://images.ecency.com",
                "https://api.hive.blog https://api.deathwing.me https://api.openhive.network https://techcoderx.com https://rpc.mahdiyari.info https://api.c0ff33a.uk https://api.syncad.com",
                "https://hivesigner.com https://hivesearcher.com https://api.hivesearcher.com",
                "https://pl.ecency.com https://chat.ecency.com",
                "https://o4507985141956608.ingest.de.sentry.io",
                "https://api.coingecko.com https://api.giphy.com",
                "https://studio.3speak.tv https://embed.3speak.tv https://3speak.tv https://poll.ecency.com https://spk.good-karma.xyz",
                "https://rpc.ankr.com https://bsc-dataseed.binance.org https://explorer.solana.com https://etherscan.io https://bscscan.com",
                "wss://enotify.ecency.com"
              ].join(" "),
              [
                "img-src 'self' data: blob:",
                "https://i.ecency.com https://img.ecency.com https://images.ecency.com https://ecency.com",
                "https://images.hive.blog https://img.youtube.com",
                "https://media.giphy.com https://media0.giphy.com https://media1.giphy.com https://media2.giphy.com https://media3.giphy.com https://media4.giphy.com https://i.giphy.com"
              ].join(" "),
              [
                "frame-src 'self'",
                "https://www.youtube.com https://youtube.com https://www.youtube-nocookie.com",
                "https://player.vimeo.com https://player.twitch.tv",
                "https://play.3speak.tv https://audio.3speak.tv https://embed.3speak.tv",
                "https://open.spotify.com https://w.soundcloud.com",
                "https://emb.d.tube https://www.vimm.tv https://dapplr.in https://embed.truvvl.com",
                "https://lbry.tv https://odysee.com https://ipfs.skatehive.app https://www.skatehype.com",
                "https://archive.org https://rumble.com https://www.brighteon.com https://www.bitchute.com",
                "https://brandnewtube.com https://www.loom.com https://aureal-embed.web.app",
                "https://platform.twitter.com https://challenges.cloudflare.com"
              ].join(" "),
              "media-src 'self' data: blob: https://i.ecency.com https://images.ecency.com https://ipfs.skatehive.app",
              "worker-src 'self' blob:",
              "object-src 'none'",
              "base-uri 'self'",
              "frame-ancestors 'self'",
              "form-action 'self'",
              "report-to csp-endpoint",
              `report-uri ${sentryCspReportUri}`
            ].join("; ")
          }
        ]
      },
      {
        // Hashed static assets (JS, CSS, media) - immutable, cache forever
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" }
        ]
      },
      {
        // Public static assets (images, icons, scripts)
        source: "/assets/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }
        ]
      },
      {
        source: "/scripts/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }
        ]
      }
    ];
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
      },
      // SEO: consolidate post URLs onto bare /@author/permlink form.
      // Matches /:category/@:author/:permlink (community-prefixed or any legacy
      // category prefix). The (?!@) on :category prevents the wild edge case
      // of /@x/@y/z matching. Edit URLs (/:cat/@a/p/edit) and sub-path URLs
      // (/:cat/@a/p/:sub) are 4 segments and don't match this 3-segment rule —
      // their existing rewrites in rewrites() handle them.
      // 308 (permanent): consolidation verified — community-prefixed URLs
      // converge onto the bare canonical with no traffic regression, so the
      // redirect is now permanent for full SEO signal transfer.
      {
        source: "/:category((?!@)[^/]+)/:author(@[^/]+)/:permlink",
        destination: "/:author/:permlink",
        permanent: true
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
          "/:author(@.+)/:section(posts|blog|comments|replies|communities|trail|followers|following|wallet|settings|insights|referrals|permissions|rss|rss.xml)",
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
        source: "/:filter(hot|created|trending|payout|muted|promoted)/:tag/:sub",
        destination: "/feed/:filter/:tag/:sub"
      },
      {
        source: "/:filter(hot|created|trending|payout|muted|promoted)/:tag",
        destination: "/feed/:filter/:tag"
      },
      {
        source: "/:filter(hot|created|trending|payout|muted|promoted)",
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
  // The ecency org lives in Sentry's EU region (visible in the runtime DSN
  // host `ingest.de.sentry.io`). Source-map upload writes to project-scoped
  // endpoints which require hitting the regional API directly — global
  // sentry.io routes reads but rejects writes with 401 "Invalid org token".
  sentryUrl: "https://de.sentry.io",
  // Pin the source-map upload to the same release identifier the runtime
  // uses (commit SHA in CI). When unset (local dev), the plugin
  // auto-detects from git/package.json — fine for non-production builds.
  ...(process.env.SENTRY_RELEASE
    ? { release: { name: process.env.SENTRY_RELEASE } }
    : {}),

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

  // Delete .map files from .next/ after the plugin uploads them to Sentry,
  // so they aren't served publicly. Replaces the deprecated `hideSourceMaps`
  // option in @sentry/nextjs v8 — combined with `productionBrowserSourceMaps:
  // true` above, this is the v8-idiomatic pattern for "generate maps,
  // upload them, then strip them from the public bundle".
  sourcemaps: {
    deleteSourcemapsAfterUpload: true
  },

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Tree-shake unused Sentry integrations to reduce client bundle size
  bundleSizeOptimizations: {
    excludeDebugStatements: true,
    excludeReplayIframe: true,
    excludeReplayShadowDom: true,
    excludeReplayWorker: true
  },

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: false
});

/** @type {import('next').NextConfig} */
const prod = withBundleAnalyzer(withPWA(withSentry));
module.exports = process.env.NODE_ENV === "production" ? prod : withBundleAnalyzer(withSentry);
