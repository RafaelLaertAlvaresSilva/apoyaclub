import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/**
 * Tests unitarios de la lógica pura (Fase 15). Solo cubren módulos sin
 * dependencias de servidor: nada que importe Supabase, `next/headers` ni
 * variables de entorno. Los flujos completos (registro, alta de
 * oportunidad, búsqueda, solicitud de contacto, suscripción) se prueban
 * con Playwright, en `tests/e2e/`.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
