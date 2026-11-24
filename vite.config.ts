import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import path from "node:path"

export default defineConfig(() => {
  return {
    base: process.env.VITE_BASE_PATH || "/",
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "./src"),
      },
    },
    server: {
      host: "0.0.0.0",
      port: parseInt(process.env.PORT || "8443"),
      strictPort: true,
      proxy: {
        "/api": {
          target: "https://back.kbnep.com",
          changeOrigin: true,
          secure: false,
        },
        "/uploads": {
          target: "https://back.kbnep.com",
          changeOrigin: true,
          secure: false,
        },
      },
    },
    preview: {
      host: "0.0.0.0",
      port: parseInt(process.env.PORT || "8443"),
      proxy: {
        "/api": {
          target: "https://back.kbnep.com",
          changeOrigin: true,
          secure: false,
        },
        "/uploads": {
          target: "https://back.kbnep.com",
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})
