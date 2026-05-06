import { defineConfig } from "vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

// node ESM helper for å kunne bruke path.resolve relativt til denne fila
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// vite config (setter entrypoint til index.html)
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
      },
    },
  },
});
