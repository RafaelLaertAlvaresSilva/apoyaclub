import { defineConfig, devices } from "@playwright/test";

/**
 * Tests de extremo a extremo de los cinco flujos críticos (Fase 15):
 * registro de club, alta de oportunidad, búsqueda, solicitud de contacto
 * y suscripción.
 *
 * IMPORTANTE: se ejecutan contra una instancia real, así que hay que
 * apuntarlos a un proyecto de Supabase de PRUEBAS, nunca al de
 * producción (crean usuarios y escriben datos). La configuración vive en
 * `.env.test.local`; ver el apartado "Tests" del README.
 *
 * Los tests que necesitan credenciales que no todo el mundo tiene
 * (un club y una empresa de prueba ya creados, claves de test de Stripe)
 * se saltan solos con un mensaje explicando qué falta, en vez de fallar.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    locale: "es-ES",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "npm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
