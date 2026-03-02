import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { defineConfig } from '@rsbuild/core';
import { pluginNodePolyfill } from '@rsbuild/plugin-node-polyfill';
import { pluginReact } from '@rsbuild/plugin-react';
import { tanstackRouter } from '@tanstack/router-plugin/rspack';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const bip39Resolved = require.resolve('bip39', {
  paths: [__dirname, path.join(__dirname, 'node_modules/@ecency/wallets')],
});

export default defineConfig({
  plugins: [pluginReact(), pluginNodePolyfill()],
  resolve: {
    alias: {
      '@': './src',
      // bip39 has only named exports; wallets uses default import — shim provides default
      'bip39': path.resolve(__dirname, 'src/shim-bip39.ts'),
      'bip39-original': bip39Resolved,
    },
  },
  tools: {
    rspack: {
      resolve: {
        // Ensure React resolves to a single instance from the app's node_modules
        // This prevents multiple React instances when importing from workspace packages
        alias: {
          react: path.resolve(__dirname, 'node_modules/react'),
          'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
          '@ecency/ui': path.resolve(__dirname, '../../packages/ui/dist/index.js'),
          'bip39': path.resolve(__dirname, 'src/shim-bip39.ts'),
          'bip39-original': bip39Resolved,
        },
      },
      plugins: [
        tanstackRouter({
          target: 'react',
          autoCodeSplitting: true,
        }),
      ],
    },
  },
});
