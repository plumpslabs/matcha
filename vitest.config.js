import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.js"],
    exclude: ["**/node_modules/**"],
    // Matcha-style: simple, deliberate
    reporters: ["verbose"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: [
        "hooks/*.js",
        "bin/*.js",
        "benchmark/*.js",
        "scripts/*.js",
      ],
      exclude: [
        "**/node_modules/**",
        "**/tests/**",
        "**/*.config.*",
      ],
    },
  },
});
