const path = require("path");
const withPWA = require("next-pwa")({
  dest: "public"
});
const { BugsnagBuildReporterPlugin } = require("webpack-bugsnag-plugins");
const appPackage = require("./package.json");

const config = {
  productionBrowserSourceMaps: true,
  sassOptions: {
    includePaths: [path.join(__dirname, "src/styles")]
  },
  webpack: (config, options) => {
    config.module.rules.push({
      test: /\.(mp3)$/,
      type: "asset/resource",
      generator: {
        filename: "static/chunks/[path][name].[hash][ext]"
      }
    });

    if (process.env.NODE_ENV === "production") {
      config.module.plugins.push(
        new BugsnagBuildReporterPlugin({
          apiKey: "53c03fdd42cd699cb95f60abe77a5b19",
          appVersion: appPackage.version
        })
      );
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
  async rewrites() {
    return [
      {
        source: "/:author/rss",
        destination: "/api/:author/posts/rss"
      }
    ];
  }
};

/** @type {import('next').NextConfig} */
const nextWithPWA = withPWA(config);
module.exports = process.env.NODE_ENV === "production" ? nextWithPWA : config;
