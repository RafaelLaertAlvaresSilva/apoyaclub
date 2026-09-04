import { hoyISO } from "@/lib/tareas-patrocinio";

/**
 * Cuándo conviene que el club mande el informe de progreso a sus
 * patrocinadores, y a cuáles les falta.
 *
 * Dos momentos en la temporada, y no por capricho:
 *
 *   - A mitad (diciembre y enero). Al empresario le recuerda que
 *     existís y que estáis cumpliendo, justo cuando ya se le ha
 *     olvidado que os pagó en septiembre. Y al club le enseña lo que
 *     lleva sin hacer CON TIEMPO PARA HACERLO: si en enero ves dos
 *     cosas en rojo te quedan cinco meses; en junio te queda una
 *     excusa.
 *
 *   - Al final (mayo y junio). Ahí ya no se arregla nada, pero es
 *     cuando el empresario decide si renueva, y conviene que decida
 *     mirando lo que recibió y no lo que recuerda.
 *
 * La temporada española de deporte base va de septiembre a junio, así
 * que las ventanas se cruzan de año: diciembre y enero son la misma
 * mitad de la misma temporada.
 */

export type Ventana = {
  tipo: "mitad" | "final";
  /** Desde cuándo cuenta esta ventana, en ISO. Un informe descargado
   *  antes de esta fecha es de la vuelta anterior y no vale. */
  desde: string;
  titulo: string;
  porQue: string;
};

export function ventanaDeInforme(hoy: string = hoyISO()): Ventana | null {
  const anio = Number(hoy.slice(0, 4));
  const mes = Number(hoy.slice(5, 7));

  if (mes === 12 || mes === 1) {
    return {
      // Enero pertenece a la temporada que empezó en septiembre del año
      // anterior: la ventana arrancó en diciembre, no hace unos días.
      desde: `${mes === 1 ? anio - 1 : anio}-12-01`,
      tipo: "mitad",
      titulo: "Estás a mitad de temporada: buen momento para mandar el informe de progreso",
      porQue:
        "Ahora todavía da tiempo a corregir lo que falte. Si esperas a junio, lo que no esté hecho ya no se arregla — solo se cuenta.",
    };
  }

  if (mes === 5 || mes === 6) {
    return {
      desde: `${anio}-05-01`,
      tipo: "final",
      titulo: "Se acaba la temporada: manda el informe antes de hablar de renovar",
      porQue:
        "Es cuando la empresa decide si sigue. Conviene que lo decida mirando lo que recibió, no lo que recuerda.",
    };
  }

  return null;
}

export type EmpresaPendienteDeInforme = {
  empresa: string;
  /** Cuándo se descargó por última vez, en ISO. Null si nunca. */
  ultimoInforme: string | null;
};

/**
 * A qué empresas les falta el informe de esta ventana.
 *
 * Una empresa aparece si el club no ha descargado su informe desde que
 * empezó la ventana. Las que ya lo tienen desaparecen de la lista: un
 * aviso que sigue ahí después de hacerle caso enseña a ignorarlo.
 */
export function empresasPendientesDeInforme(
  empresasConTareas: string[],
  ultimoInformePorEmpresa: Map<string, string>,
  ventana: Ventana,
): EmpresaPendienteDeInforme[] {
  return empresasConTareas
    .map((empresa) => ({
      empresa,
      ultimoInforme: ultimoInformePorEmpresa.get(empresa.trim().toLowerCase()) ?? null,
    }))
    .filter(({ ultimoInforme }) => !ultimoInforme || ultimoInforme.slice(0, 10) < ventana.desde)
    .sort((a, b) => a.empresa.localeCompare(b.empresa, "es"));
}

const formatoMes = new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" });

/** "nunca" o "la última vez, en octubre de 2026". */
export function cuandoFueElUltimo(ultimoInforme: string | null): string {
  if (!ultimoInforme) return "todavía no le has descargado ninguno";

  const [anio, mes, dia] = ultimoInforme.slice(0, 10).split("-").map(Number);
  return `el último fue en ${formatoMes.format(new Date(anio, mes - 1, dia))}`;
}
