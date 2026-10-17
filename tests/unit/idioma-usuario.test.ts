import { describe, expect, it } from "vitest";
import { esIdioma, idiomaDe } from "@/lib/idioma-usuario";

/**
 * El idioma en el que se escribe a cada usuario por correo. Lo que
 * importa de verdad es que nunca salga algo raro: un valor que no es un
 * idioma de la web, o una cuenta antigua sin él, tienen que acabar en
 * español, que es como se han mandado siempre los correos.
 */
describe("el idioma de cada usuario", () => {
  it("usa el que tiene guardado en su cuenta", () => {
    expect(idiomaDe({ user_metadata: { idioma: "pt" } })).toBe("pt");
    expect(idiomaDe({ user_metadata: { idioma: "en" } })).toBe("en");
  });

  it("las cuentas antiguas, sin idioma guardado, reciben español", () => {
    expect(idiomaDe({ user_metadata: { name: "Club" } })).toBe("es");
    expect(idiomaDe({ user_metadata: null })).toBe("es");
    expect(idiomaDe(null)).toBe("es");
  });

  it("un valor que no es un idioma de la web no se cuela", () => {
    expect(idiomaDe({ user_metadata: { idioma: "fr" } })).toBe("es");
    expect(idiomaDe({ user_metadata: { idioma: 3 } })).toBe("es");
    expect(esIdioma("pt-PT")).toBe(false);
  });
});
