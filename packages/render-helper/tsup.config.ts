import { defineConfig } from "tsup";

const shared = {
    entry: ["src/index.ts"],
    splitting: false,
    sourcemap: true,
    treeshake: true,
    external: [
        "he",
        "lolight",
        "lru-cache",
        "multihashes",
        "path",
        "querystring",
        "react-native-crypto-js",
        "remarkable",
        "url",
        "xmldom",
        "xss"
    ] as const,
    shims: false,
} as const;

export default defineConfig([
    // Browser build
    {
        ...shared,
        dts: {
            resolve: true,
        },
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
