import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // Mirror tsconfig's "@/*" → "./src/*" so route handlers resolve in tests.
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  // Next compiles JSX with the automatic runtime; match it so .tsx imports
  // (e.g. the root layout) render in tests without a React global.
  esbuild: { jsx: "automatic" },
  // dotenv/config: local runs pick up the factory-injected .env (dev database);
  // CI provides DATABASE_URL via the workflow's postgres service.
  // exclude: e2e/browser/network tests live under e2e/ and run in staging-verify, never the gate.
  test: {
    include: ["test/**/*.test.{ts,tsx}"],
    exclude: ["e2e/**", "**/*.spec.ts"],
    setupFiles: ["dotenv/config"],
  },
});
