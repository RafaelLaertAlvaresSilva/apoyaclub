/**
 * La ficha de una oportunidad (migración 0049).
 *
 * Antes una oportunidad era un título, un precio y un párrafo. Con eso,
 * el club y la empresa firman entendiendo cada uno una cosa distinta, y
 * la discusión aparece en marzo: "yo creía que las fotos las hacíais
 * vosotros".
 *
 * Esto lo parte en tres preguntas que se responden por separado: qué
 * recibe la empresa, quién se encarga de cada cosa, y bajo qué
 * condiciones.
 */

export type Responsable = "club" | "empresa" | "ambos";

export const RESPONSABLES: { id: Responsable; etiqueta: string; enLaFicha: string }[] = [
  { id: "club", etiqueta: "El club", enLaFicha: "El club se encarga de" },
  { id: "empresa", etiqueta: "La empresa", enLaFicha: "La empresa aporta" },
  { id: "ambos", etiqueta: "Los dos", enLaFicha: "Entre los dos" },
];

export const ETIQUETA_RESPONSABLE: Record<Responsable, string> = RESPONSABLES.reduce(
  (acumulado, uno) => ({ ...acumulado, [uno.id]: uno.etiqueta }),
  {} as Record<Responsable, string>,
);

export function leerResponsable(valor: unknown): Responsable {
  return valor === "club" || valor === "empresa" || valor === "ambos" ? valor : "club";
}

/** Algo que recibe la empresa. La cantidad es opcional. */
export type Beneficio = { texto: string; cantidad: number | null };

/** Algo que hay que hacer, y quién lo hace. */
export type Accion = { texto: string; responsable: Responsable };

export type CondicionesDeLaFicha = {
  duracion: string | null;
  frecuencia: string | null;
  desde: string | null;
  hasta: string | null;
  exclusividad: string | null;
  requisitos: string | null;
};

const MAXIMO_LINEAS = 30;
const MAXIMO_TEXTO = 200;

/**
 * Lo que llega de la base de datos no es de fiar: lo escribió una
 * versión anterior del formulario, o alguien tocando la petición. Si
 * entra tal cual, un objeto raro tumba la ficha pública del club — la
 * página que precisamente tiene que estar siempre en pie.
 */
export function leerBeneficios(valor: unknown): Beneficio[] {
  if (!Array.isArray(valor)) return [];

  return valor
    .slice(0, MAXIMO_LINEAS)
    .map((bruto): Beneficio | null => {
      if (typeof bruto !== "object" || bruto === null) return null;
      const linea = bruto as Record<string, unknown>;

      const texto = typeof linea.texto === "string" ? linea.texto.trim().slice(0, MAXIMO_TEXTO) : "";
      if (!texto) return null;

      return { texto, cantidad: leerCantidad(linea.cantidad) };
    })
    .filter((linea): linea is Beneficio => linea !== null);
}

export function leerAcciones(valor: unknown): Accion[] {
  if (!Array.isArray(valor)) return [];

  return valor
    .slice(0, MAXIMO_LINEAS)
    .map((bruto): Accion | null => {
      if (typeof bruto !== "object" || bruto === null) return null;
      const linea = bruto as Record<string, unknown>;

      const texto = typeof linea.texto === "string" ? linea.texto.trim().slice(0, MAXIMO_TEXTO) : "";
      if (!texto) return null;

      return { texto, responsable: leerResponsable(linea.responsable) };
    })
    .filter((linea): linea is Accion => linea !== null);
}

/**
 * Una cantidad solo si es un número entero y razonable.
 *
 * Cero se descarta a propósito: "0 publicaciones" no es un beneficio,
 * es una errata. Sin cantidad, la línea se enseña sin número.
 */
function leerCantidad(valor: unknown): number | null {
  const numero = typeof valor === "number" ? valor : Number.parseInt(String(valor ?? ""), 10);
  if (!Number.isFinite(numero)) return null;
  const entero = Math.trunc(numero);
  return entero >= 1 && entero <= 9999 ? entero : null;
}

/** Cómo se lee una línea de beneficio: "4 × Publicaciones en Instagram". */
export function beneficioEnTexto(beneficio: Beneficio): string {
  return beneficio.cantidad ? `${beneficio.cantidad} × ${beneficio.texto}` : beneficio.texto;
}

/**
 * Las acciones agrupadas como se enseñan: el club, la empresa y lo que
 * va entre los dos. Se devuelven en ese orden fijo y sin los grupos
 * vacíos, para que la ficha no tenga apartados en blanco.
 */
export function accionesPorResponsable(
  acciones: Accion[],
): { responsable: Responsable; titulo: string; lineas: Accion[] }[] {
  return RESPONSABLES.map((uno) => ({
    responsable: uno.id,
    titulo: uno.enLaFicha,
    lineas: acciones.filter((accion) => accion.responsable === uno.id),
  })).filter((grupo) => grupo.lineas.length > 0);
}

/** true si la ficha tiene algo estructurado que enseñar. */
export function tieneFicha(oportunidad: {
  beneficios: Beneficio[];
  acciones: Accion[];
}): boolean {
  return oportunidad.beneficios.length > 0 || oportunidad.acciones.length > 0;
}

function fecha(iso: string | null, intlLocale: string): string | null {
  if (!iso) return null;
  const momento = new Date(iso);
  if (!Number.isFinite(momento.getTime())) return null;
  return new Intl.DateTimeFormat(intlLocale, { day: "numeric", month: "long", year: "numeric" }).format(momento);
}

/** Los rótulos de las condiciones. Por defecto, en español; la página
 * pública le pasa los del idioma de quien mira. */
export type TextosDeCondiciones = {
  duracion: string;
  frecuencia: string;
  fechas: string;
  delAl: (desde: string, hasta: string) => string;
  desde: string;
  hasta: string;
  exclusividad: string;
  enExclusiva: (sector: string) => string;
  requisitos: string;
};

const TEXTOS_EN_ESPANOL: TextosDeCondiciones = {
  duracion: "Duración",
  frecuencia: "Frecuencia",
  fechas: "Fechas",
  delAl: (desde, hasta) => `Del ${desde} al ${hasta}`,
  desde: "Desde",
  hasta: "Hasta",
  exclusividad: "Exclusividad",
  enExclusiva: (sector) => `En exclusiva para el sector: ${sector}`,
  requisitos: "Otros requisitos",
};

/**
 * Las condiciones, ya en frases, sin las que estén vacías.
 *
 * Devuelve pares etiqueta/valor para pintarlos en una lista. Una
 * condición sin rellenar no sale: un "Frecuencia: —" no informa de
 * nada y hace que la ficha parezca a medias.
 */
export function condicionesEnTexto(
  condiciones: CondicionesDeLaFicha,
  textos: TextosDeCondiciones = TEXTOS_EN_ESPANOL,
  intlLocale = "es-ES",
): { que: string; valor: string }[] {
  const lineas: { que: string; valor: string }[] = [];

  if (condiciones.duracion) lineas.push({ que: textos.duracion, valor: condiciones.duracion });
  if (condiciones.frecuencia) lineas.push({ que: textos.frecuencia, valor: condiciones.frecuencia });

  const desde = fecha(condiciones.desde, intlLocale);
  const hasta = fecha(condiciones.hasta, intlLocale);
  if (desde && hasta) lineas.push({ que: textos.fechas, valor: textos.delAl(desde, hasta) });
  else if (desde) lineas.push({ que: textos.desde, valor: desde });
  else if (hasta) lineas.push({ que: textos.hasta, valor: hasta });

  if (condiciones.exclusividad) {
    lineas.push({ que: textos.exclusividad, valor: textos.enExclusiva(condiciones.exclusividad) });
  }
  if (condiciones.requisitos) lineas.push({ que: textos.requisitos, valor: condiciones.requisitos });

  return lineas;
}
