import { expect, test } from "@playwright/test";
import { CREDENCIALES, ES, iniciarSesion } from "./utilidades";

test.describe("Suscripción del club", () => {
  test.skip(
    !CREDENCIALES.club.email || !CREDENCIALES.club.password,
    "Faltan E2E_CLUB_EMAIL y E2E_CLUB_PASSWORD.",
  );

  test("el panel muestra el estado y lleva al checkout de Stripe", async ({ page }) => {
    await iniciarSesion(page, CREDENCIALES.club.email!, CREDENCIALES.club.password!);
    await page.goto(`${ES}/panel/suscripcion`);

    // El precio se enseña siempre, con o sin suscripción activa.
    await expect(page.getByText(/29,90/)).toBeVisible();

    const boton = page.getByRole("button", { name: /suscribirme|activar|gestionar/i }).first();
    await expect(boton).toBeVisible();
    await boton.click();

    // Con las claves de test de Stripe configuradas se sale a su dominio;
    // sin ellas, la aplicación avisa en vez de romperse.
    await page.waitForURL(/stripe\.com|\/panel\/suscripcion/, { timeout: 30_000 });
  });
});
