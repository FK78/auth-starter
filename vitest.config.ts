import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    clearMocks: true,
    exclude: ["**/node_modules/**", "**/*.integration.test.ts"],
    env: {
      POSTGRES_USER: "test",
      POSTGRES_PASSWORD: "test",
      POSTGRES_DB: "test",
      POSTGRES_PORT: "5432",
      ACCESS_TOKEN_SECRET: "test-secret",
    },
  },
});
