import { defineConfig } from "vite"
import dts from "vite-plugin-dts"
import path from "path"

export default defineConfig({
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

  plugins: [dts({ rollupTypes: true })],
})
