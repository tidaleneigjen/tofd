import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Dev-only: proxy same-origin /api calls to the deployed API so the public
// site works locally before CloudFront is involved. Override the target with
// VITE_DEV_API_TARGET if needed.
const devApiTarget = process.env.VITE_DEV_API_TARGET || "https://tofd.graycandle.org";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: devApiTarget,
        changeOrigin: true,
      },
    },
  },
});
