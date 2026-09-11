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
        // An entry per source file, not one bundle.
        //
        // A single pre-bundled file is opaque to the consumer's bundler: webpack
        // sees ONE module, so it can neither split it nor drop what a route never
        // imports, and every page that touched any SDK export paid for all of it.
        // Measured on vision-web (#1804): the route chunk holding this file was
        // 270 KB parsed for exactly one module, of which 237 KB never executed on
        // a community feed.
        //
        // With an entry per file plus `splitting`, esbuild hoists shared code into
        // chunks and `index.js` becomes a set of re-exports. `sideEffects: false`
        // is already declared, so a downstream bundler can then drop what a route
        // does not reach. Measured across 165 vision-web routes: mean First Load
        // JS 393 KB -> 370 KB, /chats 488 -> 390, the community feed 624 -> 597,
        // the entry page 781 -> 772.
        //
        // Module-group granularity (`src/modules/*/index.ts`) was tried first and
        // recovered less than half of that (mean 382 KB), because a group barrel
        // is retained whole as soon as one export in it is used.
        //
        // The cost is file count: dist/browser goes from 4 JS files to ~1100, and
        // the committed dist churns by that much per release. Consumers still pull
        // only the files they import.
        //
        // ⛔ The node build below MUST stay a single bundle, and not only because
        // plain Node loads it with no bundler in front of it.
        //
        // `splitting` also unifies module state across entry points. Today
        // `dist/node/index.*` and `dist/node/hive.*` are separate bundles, so each
        // carries its OWN copy of hive-tx's mutable config (nodes, User-Agent,
        // resilience, server RPC proxy). `apps/web` relies on that isolation:
        // `app/api/internal/seo/sitemap-generate/route.ts` calls `setNodes` and
        // `setUserAgent` through `@ecency/sdk/hive` to point ONE route at the
        // curated public-node list, while the rest of SSR keeps what
        // `core/sdk-init.ts` set through `ConfigManager`. Split the node build and
        // that route's settings become process-global for every concurrent render
        // in the same replica.
        //
        // The browser build shares one copy after this change, which is the right
        // behaviour for a single-user process. Verified inert for current
        // consumers: `apps/web` never imports `@ecency/sdk/hive` on the client,
        // and `apps/self-hosted`, which imports both entries, never configures
        // hive-tx in the browser.
        entry: ["src/**/*.ts", "!src/**/*.spec.ts", "!src/**/*.test.ts"],
        splitting: true,
        dts: { entry: ["src/index.ts", "src/hive.ts"] },
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
