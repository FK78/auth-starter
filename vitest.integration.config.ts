import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    clearMocks: true,
    include: ["**/*.integration.test.ts"],
    env: {
      HOST: "localhost",
      POSTGRES_USER: "test",
      POSTGRES_PASSWORD: "test",
      POSTGRES_DB: "auth_starter_test",
      POSTGRES_PORT: "55433",
      ACCESS_TOKEN_SECRET: "test-secret",
    },
  },
});
