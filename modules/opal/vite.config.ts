import { defineConfig } from "vite"
import { nodePolyfills } from "vite-plugin-node-polyfills"
import { checker } from "vite-plugin-checker"
import dts from "vite-plugin-dts"
import path from "path"

export default defineConfig({
  plugins: [
    nodePolyfills(),
    checker({ typescript: true }),
    dts({
      entryRoot: "src",
      aliasesExclude: [/^@glass\//], // type declarations don't use local aliases
    }),
  ],

  resolve: {
    alias: [
      {
        find: /^@glass\/(.+)$/,
        replacement: path.resolve(__dirname, "../$1/src"),
      },
    ],
  },

  server: { port: 8000 },

  build: {
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      formats: ["es"],
      fileName: "index",
    },

    sourcemap: true,
    target: "esnext", // Reduce bloat from legacy polyfills.
    minify: false, // Leave minification up to applications.

    rollupOptions: {
      external: [/^@glass\//], // don't bundle glass modules; keep them as peers
    },
  },
})
