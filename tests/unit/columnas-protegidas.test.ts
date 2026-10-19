import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Columnas de `clubs` que solo pueden tocar el administrador y Stripe
 * (migración 0054).
 *
 * El trigger `proteger_columnas_de_admin_y_pago` las deja como estaban
 * cuando quien escribe es el propio club. Pero es una lista escrita a
 * mano: si mañana se añade `admin_algo` o `stripe_algo` a la tabla y
 * nadie se acuerda de sumarla, el club podría volver a cambiársela él
 * solo, sin que fallase nada. Esta prueba es la que avisa.
 */
const CARPETA = join(process.cwd(), "supabase", "migrations");
const ARCHIVOS = readdirSync(CARPETA)
  .filter((nombre) => nombre.endsWith(".sql"))
  .sort();

/** Columnas que, por su nombre, son del administrador o del pago. */
const ES_PROTEGIDA = /^(admin_|stripe_|verified|subscription_|trial_|current_period_|cancel_at_|reminder_|founder_)/;

function columnasDeClubs(): string[] {
  const columnas = new Set<string>();
  for (const archivo of ARCHIVOS) {
    const sql = readFileSync(join(CARPETA, archivo), "utf8");
    for (const bloque of sql.matchAll(/alter\s+table\s+public\.clubs([\s\S]*?);/gi)) {
      for (const columna of bloque[1].matchAll(/add\s+column\s+(?:if\s+not\s+exists\s+)?([a-z_0-9]+)/gi)) {
        columnas.add(columna[1]);
      }
    }
  }
  return [...columnas];
}

function ultimaVersionDelTrigger(): string {
  let cuerpo = "";
  for (const archivo of ARCHIVOS) {
    const sql = readFileSync(join(CARPETA, archivo), "utf8");
    const encontrado = sql.match(
      /create\s+or\s+replace\s+function\s+public\.proteger_columnas_de_admin_y_pago\(\)([\s\S]*?)\$\$;/i,
    );
    if (encontrado) cuerpo = encontrado[1];
  }
  return cuerpo;
}

describe("columnas de clubs que el club no puede cambiarse", () => {
  const protegidas = columnasDeClubs().filter((columna) => ES_PROTEGIDA.test(columna));
  const trigger = ultimaVersionDelTrigger();

  it("encuentra el trigger y las columnas de administración y pago", () => {
    expect(trigger).not.toBe("");
    expect(protegidas).toEqual(
      expect.arrayContaining(["verified", "admin_suspended", "admin_test_mode", "subscription_status", "founder_number"]),
    );
  });

  it.each(protegidas)("%s se deja como estaba al actualizar y se limpia al crear", (columna) => {
    expect(trigger).toMatch(new RegExp(`new\\.${columna}\\s*:=\\s*old\\.${columna}\\s*;`));
    expect(trigger).toMatch(new RegExp(`new\\.${columna}\\s*:=\\s*(null|false)\\s*;`));
  });
});
