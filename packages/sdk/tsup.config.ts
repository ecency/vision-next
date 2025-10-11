import { defineConfig } from "tsup";

const shared = {
    entry: ["src/index.ts"],
    splitting: false,
    sourcemap: true,
    treeshake: true,
    external: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "@tanstack/react-query",
        "@hiveio/dhive",
        "hivesigner",
        "lru-cache",
        "scheduler",
        "bip39",
        "remeda",
        // avoid pulling these into browser bundles by accident
        "node-fetch",
        "undici",
        "crypto" // fine to keep external – bundlers know what to do
    ] as const,
    // avoid node shims in either target
    shims: false,
} as const;

export default defineConfig([
    // Browser build
    {
        ...shared,
        dts: true,                   // emit types once here
        format: ["esm"],
        platform: "browser",
        target: "es2020",
        outDir: "dist/browser",
        clean: true,
        minify: false,
        outExtension() {
            return { js: ".js" };      // .js is friendlier for "browser" condition
        },
        define: {
            "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV ?? "production"),
        },
    },

    // Node build (SSR, scripts, CLI)
    {
        ...shared,
        dts: false,                  // already emitted above
        format: ["esm", "cjs"],
        platform: "node",
        target: "node18",
        outDir: "dist/node",
        clean: false,
        minify: false,
        outExtension({ format }) {
            return { js: format === "esm" ? ".mjs" : ".cjs" };
        },
    },
]);
