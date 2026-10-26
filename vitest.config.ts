import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      include: [
        "app/core/security/rate-limiter.server.ts",
        "app/modules/reportes/model/reporte-dates.ts",
      ],
      exclude: ["**/*.d.ts"],
      reportsDirectory: fileURLToPath(new URL("./quality/results/coverage", import.meta.url)),
    },
  },
});
