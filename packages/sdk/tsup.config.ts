import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["src/index.ts"],
    dts: true,
    format: ["esm", "cjs"],
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
        "lru-cache",
        "scheduler",
        "react/jsx-runtime",
        "bip39",
        "hivesigner",
        "remeda",
    ]
});
