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
        "@ecency/hive-tx",
        "hivesigner",
        "lru-cache",
        "scheduler",
        "dayjs",
        "remeda",
        "bip39",
        "@scure/base",
        "@scure/bip32",
        "@wallet-standard/app",
        "@solana/web3.js",
        "node-fetch",
        "undici",
        "crypto",
        "buffer",
    ] as const,
    shims: false,
} as const;

export default defineConfig([
    // Browser build
    {
        ...shared,
        dts: true,
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
