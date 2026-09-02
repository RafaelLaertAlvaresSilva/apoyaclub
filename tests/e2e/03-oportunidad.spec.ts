import { expect, test } from "@playwright/test";
import { CREDENCIALES, ES, iniciarSesion } from "./utilidades";

test.describe("Alta de una oportunidad", () => {
  test.skip(
    !CREDENCIALES.club.email || !CREDENCIALES.club.password,
    "Faltan E2E_CLUB_EMAIL y E2E_CLUB_PASSWORD (un club de prueba ya confirmado).",
  );

  test("el club crea una oportunidad y aparece en su catálogo", async ({ page }) => {
    await iniciarSesion(page, CREDENCIALES.club.email!, CREDENCIALES.club.password!);
    await page.goto(`${ES}/panel/oportunidades`);

    const titulo = `Lona en el pabellón ${Date.now()}`;

    await page.getByRole("button", { name: /nueva oportunidad/i }).click();
    await page.getByLabel(/nombre de la oportunidad/i).fill(titulo);
    await page.getByLabel(/^tipo/i).selectOption("venue_matches");
    await page.getByLabel(/valor/i).fill("600");
    await page.getByLabel(/nivel de patrocinador/i).selectOption("colaborador");
    await page.getByRole("button", { name: /crear oportunidad/i }).click();

    await expect(page.getByText(titulo)).toBeVisible({ timeout: 15_000 });
  });
});
