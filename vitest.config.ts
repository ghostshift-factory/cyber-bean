import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // Mirror tsconfig's "@/*" → "./src/*" so route handlers resolve in tests.
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  // dotenv/config: local runs pick up the factory-injected .env (dev database);
  // CI provides DATABASE_URL via the workflow's postgres service.
  // exclude: e2e/browser/network tests live under e2e/ and run in staging-verify, never the gate.
  test: {
    include: ["test/**/*.test.ts"],
    exclude: ["e2e/**", "**/*.spec.ts"],
    setupFiles: ["dotenv/config"],
  },
});
