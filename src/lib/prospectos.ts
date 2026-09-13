/**
 * A quién escribir: la libreta de empresas del club (migración 0041).
 *
 * Aquí solo hay cálculo puro y catálogos. Las consultas viven en
 * `prospectos-datos.ts`.
 *
 * Las fechas de `next_action_on` son `date` de Postgres y llegan como
 * "2026-10-03": se comparan como texto, nunca convirtiéndolas a `Date`,
 * porque una fecha sin hora se interpreta como medianoche UTC y a un
 * club español en verano le cambiaría el día.
 */

export type OrigenProspecto = "familia" | "rival" | "barrio" | "conocido" | "otro";
export type EstadoProspecto = "pendiente" | "contactado" | "interesado" | "acuerdo" | "descartado";

/**
 * De dónde sale cada nombre.
 *
 * No es un adorno: es la pregunta que hace pensar al club dónde mirar.
 * Un club que no ha pensado nunca en los padres de sus jugadores tiene
 * delante cien puertas que ya le abren y no lo sabe.
 */
export const ORIGENES: { id: OrigenProspecto; etiqueta: string; pista: string }[] = [
  {
    id: "familia",
    etiqueta: "Familia del club",
    pista: "Padres, madres, ex jugadores, gente de la junta. Los que ya os cogen el teléfono.",
  },
  {
    id: "rival",
    etiqueta: "Patrocina a un rival",
    pista: "Ya ha decidido que el patrocinio deportivo le sirve. No hay que convencerle de la idea.",
  },
  {
    id: "barrio",
    etiqueta: "Comercio de la zona",
    pista: "Los que ven pasar a vuestras familias cada sábado camino del pabellón.",
  },
  { id: "conocido", etiqueta: "Contacto personal", pista: "Alguien a quien conocéis por otra vía." },
  { id: "otro", etiqueta: "Otro", pista: "" },
];

export const ETIQUETA_ORIGEN: Record<OrigenProspecto, string> = ORIGENES.reduce(
  (acumulado, origen) => ({ ...acumulado, [origen.id]: origen.etiqueta }),
  {} as Record<OrigenProspecto, string>,
);

export const ESTADOS: { id: EstadoProspecto; etiqueta: string; clases: string }[] = [
  { id: "pendiente", etiqueta: "Por contactar", clases: "bg-zinc-100 text-zinc-700" },
  { id: "contactado", etiqueta: "Contactado", clases: "bg-sky-100 text-sky-700" },
  { id: "interesado", etiqueta: "Interesado", clases: "bg-amber-100 text-amber-800" },
  { id: "acuerdo", etiqueta: "Acuerdo cerrado", clases: "bg-teal-100 text-teal-700" },
  { id: "descartado", etiqueta: "Dijo que no", clases: "bg-zinc-100 text-zinc-500" },
];

export const ETIQUETA_ESTADO: Record<EstadoProspecto, string> = ESTADOS.reduce(
  (acumulado, estado) => ({ ...acumulado, [estado.id]: estado.etiqueta }),
  {} as Record<EstadoProspecto, string>,
);

export const CLASES_ESTADO: Record<EstadoProspecto, string> = ESTADOS.reduce(
  (acumulado, estado) => ({ ...acumulado, [estado.id]: estado.clases }),
  {} as Record<EstadoProspecto, string>,
);

export function esOrigenValido(valor: string): valor is OrigenProspecto {
  return ORIGENES.some((origen) => origen.id === valor);
}

export function esEstadoValido(valor: string): valor is EstadoProspecto {
  return ESTADOS.some((estado) => estado.id === valor);
}

export type Prospecto = {
  id: string;
  clubId: string;
  nombre: string;
  sector: string | null;
  contactoNombre: string | null;
  contactoDatos: string | null;
  origen: OrigenProspecto;
  estado: EstadoProspecto;
  notas: string | null;
  proximoPaso: string | null;
  creadoEn: string;
};

export type ProspectoRow = {
  id: string;
  club_id: string;
  name: string;
  sector: string | null;
  contact_name: string | null;
  contact_info: string | null;
  origin: string;
  status: string;
  notes: string | null;
  next_action_on: string | null;
  created_at: string;
};

export function prospectoRowToProspecto(row: ProspectoRow): Prospecto {
  return {
    id: row.id,
    clubId: row.club_id,
    nombre: row.name,
    sector: row.sector,
    contactoNombre: row.contact_name,
    contactoDatos: row.contact_info,
    origen: esOrigenValido(row.origin) ? row.origin : "otro",
    estado: esEstadoValido(row.status) ? row.status : "pendiente",
    notas: row.notes,
    proximoPaso: row.next_action_on,
    creadoEn: row.created_at,
  };
}

/** Los estados en los que la conversación sigue viva. */
const ESTADOS_ABIERTOS: readonly EstadoProspecto[] = ["pendiente", "contactado", "interesado"];

export function estaAbierto(prospecto: Prospecto): boolean {
  return ESTADOS_ABIERTOS.includes(prospecto.estado);
}

export type ResumenDeProspectos = {
  total: number;
  porContactar: number;
  enConversacion: number;
  acuerdos: number;
  /** Los que tienen una fecha de volver a llamar que ya venció o es hoy. */
  tocanHoy: number;
};

export function resumirProspectos(prospectos: Prospecto[], hoy: string): ResumenDeProspectos {
  return {
    total: prospectos.length,
    porContactar: prospectos.filter((p) => p.estado === "pendiente").length,
    enConversacion: prospectos.filter((p) => p.estado === "contactado" || p.estado === "interesado")
      .length,
    acuerdos: prospectos.filter((p) => p.estado === "acuerdo").length,
    tocanHoy: prospectos.filter(
      (p) => estaAbierto(p) && p.proximoPaso !== null && p.proximoPaso <= hoy,
    ).length,
  };
}

/**
 * El orden en que le sirven al club.
 *
 * Primero lo que toca hoy —la mitad de los patrocinios se pierden por
 * no volver a llamar, no por un no—, después lo vivo, y al final lo
 * cerrado, que ya no pide nada.
 */
export function ordenarParaTrabajar(prospectos: Prospecto[], hoy: string): Prospecto[] {
  const prioridad = (prospecto: Prospecto): number => {
    if (estaAbierto(prospecto) && prospecto.proximoPaso !== null && prospecto.proximoPaso <= hoy) {
      return 0;
    }
    if (prospecto.estado === "interesado") return 1;
    if (prospecto.estado === "contactado") return 2;
    if (prospecto.estado === "pendiente") return 3;
    if (prospecto.estado === "acuerdo") return 4;
    return 5;
  };

  return [...prospectos].sort((a, b) => {
    const diferencia = prioridad(a) - prioridad(b);
    if (diferencia !== 0) return diferencia;

    // Dentro del mismo grupo, lo más urgente primero; y si ninguno
    // tiene fecha, lo más nuevo arriba.
    if (a.proximoPaso && b.proximoPaso) return a.proximoPaso.localeCompare(b.proximoPaso);
    if (a.proximoPaso) return -1;
    if (b.proximoPaso) return 1;
    return b.creadoEn.localeCompare(a.creadoEn);
  });
}

/** "3 de octubre de 2026" desde "2026-10-03", sin pasar por Date. */
const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
] as const;

export function fechaDelPaso(fechaISO: string): string {
  const [anio, mes, dia] = fechaISO.split("-").map(Number);
  const nombre = MESES[mes - 1];
  if (!nombre) return fechaISO;
  return `${dia} de ${nombre} de ${anio}`;
}
