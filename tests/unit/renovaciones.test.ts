import { describe, expect, it } from "vitest";
import {
  contarRenovacionesQueAvisan,
  cuantoFalta,
  diasHasta,
  estadoDeRenovacion,
  mensajeDeRenovacion,
  ordenarPorRenovacion,
  temporadaDe,
} from "@/lib/renovaciones";
import { patrocinadorDePrueba } from "../fixtures/club";

/** Un día cualquiera de marzo, lejos de fin de mes y de fin de año. */
const HOY = new Date(2026, 2, 15);

describe("las cuentas con fechas", () => {
  it("el día de hoy son cero días, no uno ni menos uno", () => {
    expect(diasHasta("2026-03-15", HOY)).toBe(0);
  });

  it("cuenta hacia delante y hacia atrás", () => {
    expect(diasHasta("2026-03-25", HOY)).toBe(10);
    expect(diasHasta("2026-03-05", HOY)).toBe(-10);
  });

  it("el cambio de hora no se come ni añade un día", () => {
    // En España el reloj se adelanta la madrugada del 29 de marzo de
    // 2026. Comparando las fechas a medianoche local, esa resta se
    // queda en 23 horas y el día desaparece al dividir entre 24.
    expect(diasHasta("2026-03-29", HOY)).toBe(14);
    expect(diasHasta("2026-03-30", HOY)).toBe(15);
    // Y en octubre, cuando se atrasa, al revés.
    expect(diasHasta("2026-10-26", new Date(2026, 9, 24))).toBe(2);
  });

  it("cruza el fin de mes y el fin de año", () => {
    expect(diasHasta("2026-04-01", new Date(2026, 2, 31))).toBe(1);
    expect(diasHasta("2027-01-01", new Date(2026, 11, 31))).toBe(1);
  });
});

describe("el estado de una renovación", () => {
  const con = (fecha: string | null) => patrocinadorDePrueba({ renewalDate: fecha });

  it("sin fecha no es un problema, pero tampoco está al día", () => {
    expect(estadoDeRenovacion(con(null), HOY)).toBe("sin-fecha");
  });

  it("hoy todavía está a tiempo", () => {
    // Quien abre el panel esa mañana no llega tarde.
    expect(estadoDeRenovacion(con("2026-03-15"), HOY)).toBe("urgente");
  });

  it("ayer ya se pasó", () => {
    expect(estadoDeRenovacion(con("2026-03-14"), HOY)).toBe("pasada");
  });

  it("los límites caen del lado que les toca", () => {
    expect(estadoDeRenovacion(con("2026-04-14"), HOY)).toBe("urgente"); // 30 días
    expect(estadoDeRenovacion(con("2026-04-15"), HOY)).toBe("proxima"); // 31
    expect(estadoDeRenovacion(con("2026-06-13"), HOY)).toBe("proxima"); // 90
    expect(estadoDeRenovacion(con("2026-06-14"), HOY)).toBe("al-dia"); // 91
  });
});

describe("el contador del menú", () => {
  it("solo cuenta lo vencido y lo urgente", () => {
    // Si contara también lo de dentro de tres meses estaría encendido
    // todo el año y dejaría de significar nada.
    const patrocinadores = [
      patrocinadorDePrueba({ id: "1", renewalDate: "2026-03-01" }), // pasada
      patrocinadorDePrueba({ id: "2", renewalDate: "2026-03-20" }), // urgente
      patrocinadorDePrueba({ id: "3", renewalDate: "2026-05-20" }), // próxima
      patrocinadorDePrueba({ id: "4", renewalDate: "2026-12-20" }), // al día
      patrocinadorDePrueba({ id: "5", renewalDate: null }), // sin fecha
    ];
    expect(contarRenovacionesQueAvisan(patrocinadores, HOY)).toBe(2);
  });
});

describe("el orden de la lista", () => {
  it("primero lo que hay que hacer antes, y los sin fecha al final", () => {
    const patrocinadores = [
      patrocinadorDePrueba({ id: "a", name: "Sin fecha", renewalDate: null }),
      patrocinadorDePrueba({ id: "b", name: "Al día", renewalDate: "2026-12-01" }),
      patrocinadorDePrueba({ id: "c", name: "Urgente", renewalDate: "2026-03-20" }),
      patrocinadorDePrueba({ id: "d", name: "Vencida", renewalDate: "2026-02-01" }),
    ];
    expect(ordenarPorRenovacion(patrocinadores, HOY).map((p) => p.name)).toEqual([
      "Vencida",
      "Urgente",
      "Al día",
      "Sin fecha",
    ]);
  });

  it("dentro del mismo estado, lo más cercano primero", () => {
    const patrocinadores = [
      patrocinadorDePrueba({ id: "a", name: "Dentro de 20", renewalDate: "2026-04-04" }),
      patrocinadorDePrueba({ id: "b", name: "Dentro de 5", renewalDate: "2026-03-20" }),
    ];
    expect(ordenarPorRenovacion(patrocinadores, HOY).map((p) => p.name)).toEqual([
      "Dentro de 5",
      "Dentro de 20",
    ]);
  });
});

describe("cuánto falta, en palabras", () => {
  it("dice hoy, mañana y ayer por su nombre", () => {
    expect(cuantoFalta("2026-03-15", HOY)).toBe("Hoy");
    expect(cuantoFalta("2026-03-16", HOY)).toBe("Mañana");
    expect(cuantoFalta("2026-03-14", HOY)).toBe("Se pasó ayer");
  });

  it("pasa a meses cuando los días dejan de decir nada", () => {
    expect(cuantoFalta("2026-04-04", HOY)).toBe("Faltan 20 días");
    expect(cuantoFalta("2026-06-15", HOY)).toBe("Faltan unos 3 meses");
  });
});

describe("el mensaje para escribir", () => {
  it("dice cuántas temporadas lleva la empresa", () => {
    const texto = mensajeDeRenovacion({
      patrocinador: patrocinadorDePrueba({ sinceYear: new Date().getFullYear() - 3 }),
      nombreDelClub: "CB Benidorm",
      temporada: "2025/26",
    });
    expect(texto).toContain("3 temporadas");
    expect(texto).toContain("CB Benidorm");
  });

  it("no inventa una antigüedad que no se sabe", () => {
    const texto = mensajeDeRenovacion({
      patrocinador: patrocinadorDePrueba({ sinceYear: null }),
      nombreDelClub: "CB Benidorm",
      temporada: "2025/26",
    });
    expect(texto).not.toContain("temporadas");
    expect(texto).toContain("Gracias por haber estado");
  });

  it("mete lo que el club apuntó del acuerdo", () => {
    const texto = mensajeDeRenovacion({
      patrocinador: patrocinadorDePrueba({ renewalNotes: "600 € y el logo en la camiseta" }),
      nombreDelClub: "CB Benidorm",
      temporada: "2025/26",
    });
    expect(texto).toContain("600 € y el logo en la camiseta");
  });

  it("no pide nada en el primer párrafo", () => {
    // Un correo que abre pidiendo dinero se contesta que no. Primero se
    // agradece lo que ya se hizo.
    const texto = mensajeDeRenovacion({
      patrocinador: patrocinadorDePrueba({ sinceYear: 2023 }),
      nombreDelClub: "CB Benidorm",
      temporada: "2025/26",
    });
    const primerParrafo = texto.split("\n\n")[1] ?? "";
    expect(primerParrafo).toContain("gracias");
    expect(primerParrafo).not.toMatch(/renov|seguir con nosotros/i);
  });
});

describe("la temporada", () => {
  it("de enero a junio todavía es la que empezó el verano anterior", () => {
    expect(temporadaDe(new Date(2026, 2, 15))).toBe("2025/26");
    expect(temporadaDe(new Date(2026, 5, 30))).toBe("2025/26");
  });

  it("de julio en adelante ya es la nueva", () => {
    expect(temporadaDe(new Date(2026, 6, 1))).toBe("2026/27");
    expect(temporadaDe(new Date(2026, 11, 31))).toBe("2026/27");
  });

  it("el cambio de siglo no deja un 2099/00 raro", () => {
    expect(temporadaDe(new Date(2099, 8, 1))).toBe("2099/00");
  });
});

describe("la sección en el panel", () => {
  it("está en Seguimiento y lleva contador", async () => {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const menu = readFileSync(
      join(process.cwd(), "src/app/[locale]/panel/components/MenuDelPanel.tsx"),
      "utf8",
    );
    const nav = readFileSync(
      join(process.cwd(), "src/app/[locale]/panel/components/PanelNav.tsx"),
      "utf8",
    );

    expect(menu).toContain('href: "/panel/renovaciones"');
    // Renovar es cumplir con quien ya está, no captar: va en
    // "Seguimiento", detrás de "Patrocinadores".
    const seguimiento = menu.slice(menu.indexOf('titulo: "Seguimiento"'), menu.indexOf('titulo: "Cuenta"'));
    expect(seguimiento).toContain("/panel/renovaciones");

    // El contador es lo que hace que no se pase la fecha: sin él, la
    // única forma de enterarse es entrar a mirar por si acaso.
    expect(menu).toContain('enlace.id === "renovaciones"');
    expect(nav).toContain("contarRenovacionesQueAvisanDelClub");
  });

  it("el contador no deja al club sin menú si falla", async () => {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const datos = readFileSync(join(process.cwd(), "src/lib/renovaciones-datos.ts"), "utf8");

    // Se pinta en TODAS las páginas del panel. Y las columnas vienen de
    // la migración 0050: hasta que un club la aplique, no existen.
    expect(datos).toContain("catch");
    expect(datos).toContain("return 0");
    // Y por eso no se filtra por la columna nueva en SQL: un `where`
    // sobre una columna que no existe devuelve error. Se mira que no
    // haya ningún filtro de Postgres, no la palabra suelta, que sale
    // en el comentario que explica justo esto.
    for (const filtro of [".lt(", ".lte(", ".gt(", ".gte(", ".filter(", ".not("]) {
      expect(datos, `hay un ${filtro} sobre una columna de la 0050`).not.toContain(filtro);
    }
  });
});
