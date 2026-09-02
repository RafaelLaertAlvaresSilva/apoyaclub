import { expect, test } from "@playwright/test";
import { ES, emailDePrueba } from "./utilidades";

test.describe("Registro de club", () => {
  test("crea la cuenta y pide confirmar el email", async ({ page }) => {
    await page.goto(`${ES}/registro-club`);

    await page.getByLabel(/nombre del club/i).fill("Club E2E");
    await page.getByLabel(/^email/i).fill(emailDePrueba("club"));
    await page.getByLabel(/contraseña/i).first().fill("ApoyaClub-e2e-2026");

    await page.getByRole("button", { name: /crear|registrar/i }).click();

    // Supabase manda un email de verificación: el destino correcto es la
    // pantalla de "revisa tu correo", no el panel.
    await expect(page).toHaveURL(/revisa-tu-correo/, { timeout: 20_000 });
  });

  test("no deja entrar al panel sin sesión", async ({ page }) => {
    await page.goto(`${ES}/panel`);
    await expect(page).toHaveURL(/\/login/);
  });

  test("rechaza un email inválido sin llamar al servidor", async ({ page }) => {
    await page.goto(`${ES}/registro-club`);
    await page.getByLabel(/nombre del club/i).fill("Club E2E");
    await page.getByLabel(/^email/i).fill("esto-no-es-un-email");
    await page.getByLabel(/contraseña/i).first().fill("ApoyaClub-e2e-2026");
    await page.getByRole("button", { name: /crear|registrar/i }).click();

    await expect(page).toHaveURL(/registro-club/);
  });
});
