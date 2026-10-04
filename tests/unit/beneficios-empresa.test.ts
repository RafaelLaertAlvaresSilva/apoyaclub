import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { CATEGORIAS_IDEA, TOTAL_DE_IDEAS } from "@/lib/catalogo-ideas";

const RAIZ = process.cwd();

const SECCIONES = readFileSync(
  join(RAIZ, "src", "app", "[locale]", "components", "secciones.tsx"),
  "utf8",
);

type Tarjeta = {
  clave: string;
  titulo: string;
  texto: string;
  cifra: string;
  dato: string;
  fuente: string;
  aviso?: string;
};

const BENEFICIOS = (
  JSON.parse(readFileSync(join(RAIZ, "messages", "es", "home.json"), "utf8")) as {
    paraEmpresas: { beneficios: { tarjetas: Tarjeta[]; franja: unknown[] } };
  }
).paraEmpresas.beneficios;

const TEXTO = JSON.stringify(BENEFICIOS);

/**
 * La sección de beneficios para empresas, y lo que NO puede volver a
 * entrar en ella.
 *
 * Esta sección se montó dos veces a partir de dos maquetas generadas
 * con IA, y las dos traían un dato con fuente en cada tarjeta. En las
 * dos, ninguno se pudo encontrar publicado:
 *
 *   - "el 77 % de los consumidores…", Nielsen Sports (2021)
 *   - "el 70 % de las familias…", UEFA (2021)
 *   - "el 85 % de los consumidores…", Cone Communications (2023) — y el
 *     último estudio CSR de Cone es de 2017
 *   - "el 63 % de las marcas…", IEG Sponsorship Report (2022)
 *   - "el 64 % de las empresas…", Asociación Española de la
 *     Comunicación (2022), organismo que no se encuentra con ese nombre
 *
 * Y el dato fiscal fue falso de dos formas seguidas: "hasta un 40 % de
 * deducción" (eso es de los donativos) y luego "deducción del 25 %,
 * 35 % en algunos casos" (el 25 % es el TIPO del impuesto, no una
 * deducción, y el 35 % no existe en el Impuesto sobre Sociedades).
 *
 * La segunda maqueta añadió numeritos en superíndice sobre las mismas
 * cifras, sin bibliografía detrás. Un superíndice no es una fuente.
 *
 * Una prueba no puede comprobar que un dato sea cierto. Lo que hace
 * esta es acotar: cada cifra lleva fuente escrita, la tarjeta fiscal no
 * promete deducciones que no existen, y las dos cifras que salen del
 * propio producto cuadran con el código. Si alguien vuelve a pegar la
 * maqueta, salta.
 */
describe("los beneficios para empresas", () => {
  it("están las seis razones, y cada una con su dato", () => {
    expect(BENEFICIOS.tarjetas).toHaveLength(6);
    for (const tarjeta of BENEFICIOS.tarjetas) {
      expect(tarjeta.cifra, `"${tarjeta.clave}" sin cifra`).toBeTruthy();
      expect(tarjeta.dato.length, `"${tarjeta.clave}" sin explicación`).toBeGreaterThan(20);
      expect(tarjeta.fuente, `"${tarjeta.clave}" no dice de dónde sale`).toBeTruthy();
    }
  });

  it("las cifras del propio producto cuadran con el código", () => {
    // Estas dos son las más comprobables de todas, y por eso son las
    // que más fácil se quedan obsoletas: basta con añadir una idea al
    // catálogo para que la web mienta.
    const medida = BENEFICIOS.tarjetas.find((t) => t.clave === "medida");
    expect(medida, "no está la tarjeta de acciones a medida").toBeDefined();
    expect(medida!.cifra).toContain(String(TOTAL_DE_IDEAS));
    expect(medida!.dato).toContain(String(CATEGORIAS_IDEA.length));
  });

  it("la tarjeta fiscal dice lo que de verdad pasa", () => {
    const fiscal = BENEFICIOS.tarjetas.find((t) => t.clave === "fiscal");
    expect(fiscal, "no está la tarjeta fiscal").toBeDefined();
    expect(fiscal!.texto).toContain("gasto de publicidad");
    // Y avisa de la figura con la que se confunde.
    expect(fiscal!.aviso ?? "").toContain("donativos");
  });

  it("no vuelven los porcentajes fiscales que no existen", () => {
    // El 40 % es de los donativos. El 35 % no es ningún tipo del IS.
    expect(TEXTO).not.toMatch(/40\s*%/);
    expect(TEXTO).not.toMatch(/35\s*%/);
  });

  it("no vuelven las fuentes que no se pudieron verificar", () => {
    for (const sospechosa of [
      "Nielsen Sports (2021)",
      "UEFA (2021)",
      "Cone Communications",
      "IEG Sponsorship",
      "Asociación Española de la Comunicación",
      "Fundación España Activa",
    ]) {
      expect(TEXTO, `ha vuelto "${sospechosa}", que no se pudo verificar`).not.toContain(
        sospechosa,
      );
    }
  });

  it("la foto de fondo es solo de ordenador", () => {
    // En el teléfono la sección son seis tarjetas de texto apiladas: la
    // foto no se vería más que en los huecos, y pesa 103 KB.
    const fondo = SECCIONES.slice(
      SECCIONES.indexOf('src="/fondo-beneficios.webp"') - 400,
      SECCIONES.indexOf('src="/fondo-beneficios.webp"') + 200,
    );
    expect(fondo).toContain("hidden lg:block");
    expect(fondo).toContain('loading="lazy"');
  });
});
