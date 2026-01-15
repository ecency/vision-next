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
        "node-fetch",
        "undici",
        "crypto"
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
        minify: false,
        outExtension({ format }) {
            return { js: format === "esm" ? ".mjs" : ".cjs" };
        },
    },
]);
