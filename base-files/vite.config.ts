import { defineConfig } from "vite"
import { nodePolyfills } from "vite-plugin-node-polyfills"
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

  plugins: [dts(), nodePolyfills()],
})
