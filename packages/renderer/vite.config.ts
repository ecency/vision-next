import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dtsPlugin from "vite-plugin-dts";

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/lib/index.ts"),
      name: "EcencyRenderer",
      formats: ["es", "cjs"],
      fileName: (format) =>
          format === "es" ? "ecency-renderer.es.js" : "ecency-renderer.cjs"
    },
    rollupOptions: {
      external: [
        "react",
        "react-dom",
        "react-dom/client",
        "scheduler",
        "clsx",
        "@ecency/render-helper",
        "medium-zoom",
        "react/jsx-runtime",
        "@hiveio/dhive"
      ]
    },
    sourcemap: false
  },
  plugins: [
    react(),
    dtsPlugin({
      rollupTypes: false,
      tsconfigPath: "./tsconfig.json"
    })
  ],
  resolve: {
    alias: {
      sass: "sass-embedded"
    }
  }
});
