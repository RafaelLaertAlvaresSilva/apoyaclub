import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const RAIZ = process.cwd();

const HOME = JSON.parse(
  readFileSync(join(RAIZ, "messages", "es", "home.json"), "utf8"),
) as Record<string, never>;

type Tarjeta = { clave: string; titulo: string; texto: string; aviso?: string };
type Dato = { clave: string; cifra: string; que: string; fuente: string };

const BENEFICIOS = (HOME as unknown as {
  paraEmpresas: {
    beneficios: { tarjetas: Tarjeta[]; franja: Dato[] };
  };
}).paraEmpresas.beneficios;

/** Todo el texto de la sección, de una tirada. */
const TEXTO = JSON.stringify(BENEFICIOS);

/**
 * La sección de beneficios para empresas, y lo que NO puede volver a
 * entrar en ella.
 *
 * La maqueta de la que salió traía seis porcentajes con fuente, uno por
 * tarjeta. Ninguno se pudo verificar y uno era directamente falso:
 * "hasta un 40 % de deducción fiscal por patrocinio deportivo", citando
 * la Ley 49/2002. Ese 35-40 % existe, pero es una deducción en cuota
 * para DONATIVOS; el patrocinio es un contrato publicitario y se deduce
 * de la base, como cualquier gasto de marketing. Son regímenes
 * distintos, y decirle a una empresa que se deduce el 40 % por
 * patrocinar es una afirmación que su asesoría desmiente en la primera
 * llamada.
 *
 * Esta prueba no puede comprobar que un dato sea cierto. Lo que hace es
 * más modesto y más útil: cada cifra de la franja tiene que llevar su
 * fuente escrita, y la tarjeta fiscal no puede volver a prometer un
 * porcentaje de deducción. Si alguien pega otra vez la maqueta, salta.
 */
describe("los beneficios para empresas", () => {
  it("están las seis razones", () => {
    expect(BENEFICIOS.tarjetas).toHaveLength(6);
    for (const tarjeta of BENEFICIOS.tarjetas) {
      expect(tarjeta.titulo.length, `"${tarjeta.clave}" sin título`).toBeGreaterThan(3);
      expect(tarjeta.texto.length, `"${tarjeta.clave}" sin texto`).toBeGreaterThan(30);
    }
  });

  it("ninguna razón se apoya en un porcentaje", () => {
    // No es que un porcentaje esté prohibido: es que los que traía la
    // maqueta eran inventados. Si algún día hay uno de verdad, irá en
    // la franja, que es donde se escribe la fuente.
    for (const tarjeta of BENEFICIOS.tarjetas) {
      const conPorcentaje = `${tarjeta.titulo} ${tarjeta.texto}`.match(/\d+\s*%/);
      expect(conPorcentaje, `"${tarjeta.clave}" ha vuelto a meter un porcentaje`).toBeNull();
    }
  });

  it("la tarjeta fiscal no promete una deducción en cuota", () => {
    const fiscal = BENEFICIOS.tarjetas.find((t) => t.clave === "fiscal");
    expect(fiscal, "no está la tarjeta fiscal").toBeDefined();
    expect(fiscal!.texto).toContain("gasto de publicidad");
    // Y avisa de la figura con la que se confunde.
    expect(fiscal!.aviso ?? "").toContain("donativos");
    expect(TEXTO).not.toMatch(/40\s*%/);
  });

  it("cada cifra de la franja lleva su fuente y el año del dato", () => {
    const conCifra = BENEFICIOS.franja.filter((d) => /\d/.test(d.cifra));
    expect(conCifra.length, "la franja se ha quedado sin cifras").toBeGreaterThanOrEqual(3);

    for (const dato of conCifra) {
      expect(dato.fuente, `"${dato.clave}" no dice de dónde sale`).toBeTruthy();
      expect(dato.fuente, `"${dato.clave}" no dice de qué año es`).toMatch(/20\d\d/);
    }
  });

  it("no vuelven las fuentes que no se pudieron verificar", () => {
    // Las seis de la maqueta. Si reaparece cualquiera, es que alguien
    // ha vuelto a pegar los datos sin comprobarlos.
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
});
