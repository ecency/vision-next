import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["src/index.ts"],
    dts: true,
    format: ["esm", "cjs"],
    outExtension({ format }) {
        return {
            js: format === "esm" ? ".mjs" : ".cjs",
        };
    },
    sourcemap: true,
    clean: true,
    treeshake: true,
    splitting: false, // libraries often keep this off for simpler exports
    target: "es2022",
    // Mark big/peer things external so they don’t get bundled
    external: [
        "crypto",
        "react",
        "@hiveio/dhive",
        "@tanstack/react-query",
        "@ecency/sdk",
        "lru-cache",
        "scheduler",
        "react/jsx-runtime",
        "@okxweb3/coin-aptos",
        "@okxweb3/coin-base",
        "@okxweb3/coin-bitcoin",
        "@okxweb3/coin-ethereum",
        "@okxweb3/coin-solana",
        "@okxweb3/coin-ton",
        "@okxweb3/coin-tron",
        "@okxweb3/crypto-lib",
        "bip39",
        "hivesigner",
        "dayjs",
        "remeda",
    ]
});
