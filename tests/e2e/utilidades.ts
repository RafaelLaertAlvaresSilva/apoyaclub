import { expect, type Page } from "@playwright/test";

/** Todas las rutas llevan prefijo de idioma (next-intl, Fase 14). */
export const ES = "/es";

/** Email irrepetible para cada ejecución, con un dominio reconocible
 * para poder limpiar después lo que dejen los tests. */
export function emailDePrueba(prefijo: string): string {
  return `${prefijo}-${Date.now()}-${Math.floor(Math.random() * 1000)}@e2e.apoyaclub.test`;
}

export const CREDENCIALES = {
  club: {
    email: process.env.E2E_CLUB_EMAIL,
    password: process.env.E2E_CLUB_PASSWORD,
  },
  empresa: {
    email: process.env.E2E_EMPRESA_EMAIL,
    password: process.env.E2E_EMPRESA_PASSWORD,
  },
};

export async function iniciarSesion(page: Page, email: string, password: string) {
  await page.goto(`${ES}/login`);
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/contraseña/i).fill(password);
  await page.getByRole("button", { name: /entrar|iniciar sesión|acceder/i }).click();
  await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 });
}
