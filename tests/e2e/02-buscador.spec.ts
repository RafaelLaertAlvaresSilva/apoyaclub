import { expect, test } from "@playwright/test";
import { ES } from "./utilidades";

test.describe("Buscador de oportunidades", () => {
  test("los filtros viajan en la URL, así que la búsqueda se puede compartir", async ({ page }) => {
    await page.goto(`${ES}/buscar?provincia=Valencia&min=50&max=500&patrocinio=principal`);

    await expect(page).toHaveURL(/patrocinio=principal/);
    // La página responde, con resultados o con el estado vacío útil.
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("una búsqueda imposible ofrece salida en vez de una página en blanco", async ({ page }) => {
    await page.goto(`${ES}/buscar?ubicacion=Teruel&radio=10&min=999999`);

    await expect(
      page.getByText(/ampliar el radio|quitar algún filtro|no hemos encontrado|sin resultados/i),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("ignora parámetros inventados sin romperse", async ({ page }) => {
    const respuesta = await page.goto(`${ES}/buscar?tipo=inventado&orden=aleatorio&radio=-5`);
    expect(respuesta?.status()).toBeLessThan(400);
  });

  test("desde la cabecera se llega al buscador", async ({ page }) => {
    await page.goto(ES);
    await page.getByRole("link", { name: /buscar clubes|clubes/i }).first().click();
    await expect(page).toHaveURL(/\/buscar/);
  });
});
