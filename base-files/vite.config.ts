import { defineConfig } from "vite"
import { NodeGlobalsPolyfillPlugin } from "@esbuild-plugins/node-globals-polyfill"
import dts from "vite-plugin-dts"
import path from "path"

export default defineConfig({
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

  plugins: [
    // Build type declarations for the library.
    dts({ rollupTypes: true }),
  ],

  optimizeDeps: {
    esbuildOptions: {
      // Add polyfills for Node.js globals.
      define: { global: "globalThis" },
      plugins: [NodeGlobalsPolyfillPlugin({ process: true, buffer: true })],
    },
  },

  resolve: {
    alias: {
      // Add polyfills for Node.js system libraries.
      zlib: "browserify-zlib",
      stream: "stream-browserify",
      assert: "assert-browserify",
      util: "util",
    },
  },
})
