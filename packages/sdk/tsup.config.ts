import { defineConfig } from "tsup";

const shared = {
    entry: ["src/index.ts", "src/hive.ts"],
    splitting: false,
    sourcemap: true,
    treeshake: true,
    external: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "@tanstack/react-query",
        "@noble/ciphers",
        "@noble/curves",
        "@noble/hashes",
        "@noble/hashes/sha2.js",
        "bs58",
        "hivesigner",
        "lru-cache",
        "scheduler",
        "bip39",
        "node-fetch",
        "undici",
        "crypto"
    ],
    shims: false,
};

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
        minify: true,
        outExtension() {
            return { js: ".js" };
        },
        define: {
            "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV ?? "production"),
            "process.env.VITE_HELIUS_API_KEY": JSON.stringify(process.env.VITE_HELIUS_API_KEY ?? ""),
        },
    },
    // Node build (SSR, scripts, CLI)
    {
        ...shared,
        dts: false,
        format: ["esm", "cjs"],
        platform: "node",
        target: "node18",
        outDir: "dist/node",
        clean: false,
        minify: true,
        outExtension({ format }) {
            return { js: format === "esm" ? ".mjs" : ".cjs" };
        },
    },
]);
