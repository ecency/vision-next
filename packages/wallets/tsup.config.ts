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
        "@ecency/sdk",
        "@hiveio/dhive",
        "hivesigner",
        "lru-cache",
        "scheduler",
        "dayjs",
        "remeda",
        "bip39",
        "@okxweb3/coin-aptos",
        "@okxweb3/coin-base",
        "@okxweb3/coin-bitcoin",
        "@okxweb3/coin-ethereum",
        "@okxweb3/coin-solana",
        "@okxweb3/coin-ton",
        "@okxweb3/coin-tron",
        "@okxweb3/crypto-lib",
        // keep these out of browser bundle
        "node-fetch",
        "undici",
        // allow app/bundler to handle builtins
        "crypto",
        "buffer",
    ] as const,
    shims: false,
} as const;

export default defineConfig([
    // Browser build
    {
        ...shared,
        dts: true,                 // emit types once
        format: ["esm"],
        platform: "browser",
        target: "es2020",
        outDir: "dist/browser",
        clean: true,
        minify: false,
        outExtension: () => ({ js: ".js" }),
        define: {
            "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV ?? "production"),
        },
    },
    // Node build
    {
        ...shared,
        dts: false,
        format: ["esm", "cjs"],
        platform: "node",
        target: "node18",
        outDir: "dist/node",
        clean: false,
        minify: false,
        outExtension: ({ format }) => ({ js: format === "esm" ? ".mjs" : ".cjs" }),
    },
]);
