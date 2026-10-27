import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    // globals lets @testing-library/react clean up the DOM after each test automatically
    globals: true,
    include: ["src/**/*.test.{ts,tsx}"],
    // src/__tests__ holds an old Jest-style test that has no runner set up.
    exclude: ["src/__tests__/**", "node_modules/**"],
  },
});
