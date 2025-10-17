import { defineConfig } from "@playwright/test";
export default defineConfig({
  timeout: 30000,
  use: { headless: true, baseURL: process.env.BASE_URL || "https://play.duelly.online" }
});
