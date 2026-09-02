import { expect, test } from "@playwright/test";
import { CREDENCIALES, ES, iniciarSesion } from "./utilidades";

test.describe("Solicitud de contacto de una empresa", () => {
  test.skip(
    !CREDENCIALES.empresa.email || !CREDENCIALES.empresa.password,
    "Faltan E2E_EMPRESA_EMAIL y E2E_EMPRESA_PASSWORD (una empresa de prueba ya confirmada).",
  );

  test("la empresa encuentra un club y le solicita contacto", async ({ page }) => {
    await iniciarSesion(page, CREDENCIALES.empresa.email!, CREDENCIALES.empresa.password!);

    await page.goto(`${ES}/buscar`);
    const primerClub = page.getByRole("link", { name: /ver club/i }).first();
    await expect(primerClub).toBeVisible({ timeout: 15_000 });
    await primerClub.click();

    await page.getByRole("button", { name: /solicitar/i }).first().click();
    await page
      .getByRole("textbox", { name: /mensaje|cuéntale/i })
      .fill("Somos una empresa local y nos interesa colaborar esta temporada. (test e2e)");
    await page.getByRole("button", { name: /enviar/i }).click();

    await expect(page.getByText(/hemos enviado|solicitud enviada|gracias/i)).toBeVisible({
      timeout: 15_000,
    });
  });
});
